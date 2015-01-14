var app = {

	els: {},

	registerElements: function () {
		this.els.$veil   = $('section#veil');
		this.els.$main   = $('section#main');
		this.els.$header = $('.header-container');

		// Sections
		this.els.$landing = this.els.$main.find('section#landing');
		this.els.$gallery = this.els.$main.find('section#gallery');
		this.els.$about   = this.els.$main.find('section#about');
		this.els.$contact = this.els.$main.find('section#contact');

		// Gallery elements
		this.els.$galleryGrid = this.els.$gallery.find('.gallery-grid');
		this.els.$galleryBtn  = this.els.$gallery.find('.gallery-more');

		// TODO: move to this.bindEvents
		$(window).on('beforeunload', function() { $(this).scrollTop(0); });
		this.els.$galleryBtn.on('click', $.proxy(this.unfoldGalleryGrid, this));
	},

	init: function () {
		this.registerElements();
		this.initialCalculations();
		this.initGallery();

		this.initialLoad();
	},

	initialCalculations: function () {
		this.documentHeight = $(document).outerHeight(true)
		this.windowHeight   = $(window).outerHeight(true);
	},

	initialLoad: function () {
		var that = this;

		this.setBlockHeight();

		window.setTimeout(function () {
			that.els.$main.toggleClass('hide', false);
			that.els.$veil.toggleClass('disolve', true); // Start showing section#main
			window.setTimeout(function () {
				that.firstLoadCallback();
			}, 1200); // timeout must match with css transition for section#veil
		}, 500); // Loading delay
	},

	registerAllAnimatedElements: function () {
		this.setBlockTops();
		this.registerAnimatedPaths();
		this.registerAnimatedBlocks();
	},

	firstLoadCallback: function () {
		var that = this;

		// Setting '.page-block' position as relative so veil fading effect works properly
		this.els.$main.find('.page-block').css('position', 'relative');
		this.registerAllAnimatedElements();
		this.els.$veil.toggleClass('hide', true);

		this.scrollLock = true;
		$(window).scroll(function () {
			that.scrollLock = false;
		});

		this.els.$veil.remove();

		window.setInterval(function () {
			if ( ! that.scrollLock ) {
				that.scrollLock = true;
				that.appScroll();
			}
		}, 80);

	},

	setBlockHeight: function () {
		// windows height must be available, check initialCalculations function
		var $main = this.els.$main,
			wh    = this.windowHeight;

		$main.find('section#landing').css('height', wh + 'px');
		$main.find('.page-block-fixed').each(function () {
			$(this).css('height', wh * 2 + 'px');
		});
	},

	setBlockTops: function () {
		var $this,
			blockTop;
		this.els.$main.find('.page-block').each(function () {
			$this = $(this);
			blockTop = $this.position().top;
			$this.data('top', blockTop);
			$this.data('bottom', blockTop + $this.outerHeight(true));
		});
	},

	initGallery: function () {
		this.initPhotoSwipeFromDOM('.anibal-tatto-gallery');
	},

	registerAnimatedPaths: function () {
		var _this = this,
			defaultLimits = { top: 0, bottom: this.documentHeight };
		this.animatedPaths = []; // TODO: move above

		d3.selectAll('.page-block .animated-line').each(function (d, j) {
			var path = d3.select(this),
				pathLen = path.node().getTotalLength(),
				blockLimits = $(this).closest('.page-block').data(),
				diff;

			if ( typeof blockLimits.top === 'undefined' || typeof blockLimits.bottom === 'undefined' ) {
				blockLimits = defaultLimits;
			}

			diff = blockLimits.bottom - blockLimits.top;

			path.attr("stroke-dasharray", pathLen + " " + pathLen)
				.attr("stroke-dashoffset", pathLen);

			_this.animatedPaths.push({
				d3el: path,
				len: pathLen,
				top: blockLimits.top,
				bottom: blockLimits.bottom,
				diff: diff
			});

		});
	},

	registerAnimatedBlocks: function () {
		var _this = this;
		this.floatingBlocks = [];
		this.els.$main.find('.page-block-fixed').each(function () {
			_this.floatingBlocks.push({
				$el: $(this),
				$fixed: $(this).find('.floating-fixed-block'),
				top: $(this).data().top,
				bottom: $(this).data().bottom,
			});
		});
	},

	appScroll: function () {
		var scrollTop = $(window).scrollTop(),
			stwh = scrollTop + this.windowHeight; // stwh: scroll top + window height

		this.els.$header.toggleClass('shown', scrollTop > 300 );

		this.animatePaths(stwh);
		this.fixfloatingBlocks(stwh);
	},

	animatePaths: function (stwh) { // stwh: scroll top + window height
		var listLen = this.animatedPaths.length,
			offset = 120,
			path,
			len;
		for ( var i = 0 ; i < listLen ; i++ ) {
			path = this.animatedPaths[i];
			if ( stwh >= (path.top - offset) && stwh <= (path.bottom + offset) ) {
				len = path.len;
				path.d3el.transition()
					.duration(60)
					.ease("linear")
					.attr('stroke-dashoffset', len - (len * (stwh - path.top) / path.diff ));
			}
		}
	},

	fixfloatingBlocks: function (stwh) { // stwh: scroll top + window height
		var listLen = this.floatingBlocks.length,
			st2wh = stwh - this.windowHeight,
			block,
			isfixed;
		for ( var i = 0 ; i < listLen ; i++ ) {
			block = this.floatingBlocks[i];
			isfixed = block.$fixed.hasClass('fixed');
			if ( st2wh < block.top && isfixed) {
				block.$fixed.toggleClass('fixed', false);
			}
			else if ( st2wh >= block.top && !isfixed) {
				block.$fixed.toggleClass('fixed', true);
			}
		}
	},

	unfoldGalleryGrid: function () {
		this.els.$galleryGrid.toggleClass('show-all', true);
		this.els.$galleryBtn.css({ 'display': 'none' });

		this.registerAllAnimatedElements();
	},

	initPhotoSwipeFromDOM: function (gallerySelector) {
		// Code example taken from plugins page: http://photoswipe.com/documentation/getting-started.html
		// Grabs images from DOM and builds object to initialize library. Implemented in pure js.

		// parse slide data (url, title, size ...) from DOM elements
		// (children of gallerySelector)
		var parseThumbnailElements = function(el) {
			var thumbElements = el.childNodes,
				numNodes = thumbElements.length,
				items = [],
				figureEl,
				linkEl,
				size,
				item;

			for(var i = 0; i < numNodes; i++) {

				figureEl = thumbElements[i]; // <figure> element

				// include only element nodes
				if(figureEl.nodeType !== 1) {
					continue;
				}

				linkEl = figureEl.children[0]; // <a> element

				size = linkEl.getAttribute('data-size').split('x');

				// create slide object
				item = {
					src: linkEl.getAttribute('href'),
					w: parseInt(size[0], 10),
					h: parseInt(size[1], 10)
				};

				if(figureEl.children.length > 1) {
					// <figcaption> content
					item.title = figureEl.children[1].innerHTML;
				}

				if(linkEl.children.length > 0) {
					// <img> thumbnail element, retrieving thumbnail url
					item.msrc = linkEl.children[0].getAttribute('src');
				}

				item.el = figureEl; // save link to element for getThumbBoundsFn
				items.push(item);
			}

			return items;
		};

		// find nearest parent element
		var closest = function closest(el, fn) {
			return el && ( fn(el) ? el : closest(el.parentNode, fn) );
		};

		// triggers when user clicks on thumbnail
		var onThumbnailsClick = function(e) {
			e = e || window.event;
			e.preventDefault ? e.preventDefault() : e.returnValue = false;

			var eTarget = e.target || e.srcElement;

			// find root element of slide
			var clickedListItem = closest(eTarget, function(el) {
				return (el.tagName && el.tagName.toUpperCase() === 'FIGURE');
			});

			if(!clickedListItem) {
				return;
			}

			// find index of clicked item by looping through all child nodes
			// alternatively, you may define index via data- attribute
			var clickedGallery = clickedListItem.parentNode,
				childNodes = clickedListItem.parentNode.childNodes,
				numChildNodes = childNodes.length,
				nodeIndex = 0,
				index;

			for (var i = 0; i < numChildNodes; i++) {
				if(childNodes[i].nodeType !== 1) {
					continue;
				}

				if(childNodes[i] === clickedListItem) {
					index = nodeIndex;
					break;
				}
				nodeIndex++;
			}



			if(index >= 0) {
				// open PhotoSwipe if valid index found
				openPhotoSwipe( index, clickedGallery );
			}
			return false;
		};

		// parse picture index and gallery index from URL (#&pid=1&gid=2)
		var photoswipeParseHash = function() {
			var hash = window.location.hash.substring(1),
				params = {};

			if(hash.length < 5) {
				return params;
			}

			var vars = hash.split('&');
			for (var i = 0; i < vars.length; i++) {
				if(!vars[i]) {
					continue;
				}
				var pair = vars[i].split('=');
				if(pair.length < 2) {
					continue;
				}
				params[pair[0]] = pair[1];
			}

			if(params.gid) {
				params.gid = parseInt(params.gid, 10);
			}

			if(!params.hasOwnProperty('pid')) {
				return params;
			}
			params.pid = parseInt(params.pid, 10);
			return params;
		};

		var openPhotoSwipe = function(index, galleryElement, disableAnimation) {
			var pswpElement = document.querySelectorAll('.pswp')[0],
				gallery,
				options,
				items;

			items = parseThumbnailElements(galleryElement);

			// define options (if needed)
			options = {
				index: index,

				// define gallery index (for URL)
				galleryUID: galleryElement.getAttribute('data-pswp-uid'),

				getThumbBoundsFn: function(index) {
					// See Options -> getThumbBoundsFn section of documentation for more info
					var thumbnail = items[index].el.getElementsByTagName('img')[0], // find thumbnail
						pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
						rect = thumbnail.getBoundingClientRect();

					return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
				}

			};

			if(disableAnimation) {
				options.showAnimationDuration = 0;
			}

			// Pass data to PhotoSwipe and initialize it
			gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
			gallery.init();
		};

		// loop through all gallery elements and bind events
		var galleryElements = document.querySelectorAll( gallerySelector );

		for(var i = 0, l = galleryElements.length; i < l; i++) {
			galleryElements[i].setAttribute('data-pswp-uid', i+1);
			galleryElements[i].onclick = onThumbnailsClick;
		}

		// Parse URL and open gallery if it contains #&pid=3&gid=1
		var hashData = photoswipeParseHash();
		if(hashData.pid > 0 && hashData.gid > 0) {
			openPhotoSwipe( hashData.pid - 1 ,  galleryElements[ hashData.gid - 1 ], true );
		}
	}
}

app.init();
