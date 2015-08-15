var app = {

	els: {},

	registerElements: function () {
		this.els.$veil   = $('section#veil');
		this.els.$main   = $('section#main');
		this.els.$header = $('.header-container');
		this.els.$nav    = this.els.$header.find('nav');

		// Sections
		this.els.$landing = this.els.$main.find('section#landing');
		this.els.$gallery = this.els.$main.find('section#gallery');
		this.els.$about   = this.els.$main.find('section#about');
		this.els.$artists = this.els.$main.find('section#artists');
		this.els.$contact = this.els.$main.find('section#contact');

		// Gallery elements
		this.gallery = null;
		this.els.$galleryGrid = this.els.$gallery.find('.gallery-grid');
		this.els.$galleryBtn  = this.els.$gallery.find('.gallery-more');

		// TODO: move to this.bindEvents
		$(window).on('beforeunload', function() { $(this).scrollTop(0); });
		this.els.$header.delegate('a', 'click', $.proxy(this.scrollToAnchor, this));
		this.els.$nav.delegate('.menu-toggle', 'click', $.proxy(this.toggleMenu, this));
		this.els.$galleryBtn.on('click', $.proxy(this.unfoldGalleryGrid, this));
	},

	init: function () {
		var _this = this;
		this.registerElements();
		this.initialCalculations();
		this.initGallery();
		this.initLazyLoading();

		var $artistToggle = this.els.$main.find('.artist-toggle');
		$artistToggle.delegate('li', 'click', function () {
			$artistToggle.find('li').removeClass('selected');
			$(this).addClass('selected');
			_this.els.$galleryGrid.removeClass (function (index, css) {
				return (css.match (/(^|\s)selected-\S+/g) || []).join(' ');
			});
			_this.els.$galleryGrid.addClass($(this).data('artist'));
			_this.els.$galleryGrid.find('.thumb img.lazy-load').trigger('galleryLoadMore');
			_this.registerAllAnimatedElements();
		});

		this.initialLoad();
	},

	initialCalculations: function () {
		this.documentHeight = $(document).outerHeight(true)
		this.windowHeight   = $(window).outerHeight(true);
		this.windowWidth   = $(window).outerWidth(true);
		this.mobileWidth   = 960;
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
		if ( this.windowWidth < this.mobileWidth ) {
			return;
		}
		this.setBlockTops();
		this.registerAnimatedPaths();
		this.registerAnimatedBlocks();
	},

	firstLoadCallback: function () {
		var that = this;

		// Setting '.page-block' position as relative so veil fading effect works properly
		this.els.$main.find('.page-block').css('position', 'relative');
		if ( this.windowWidth >= this.mobileWidth ) {
			this.registerAllAnimatedElements();
		}
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

		this.els.$landing.css('height', (wh > 800) ? 800 : wh + 'px'); // Landing image bg is 800px high
		if (this.windowWidth > 720) {
			$main.find('.page-block-fixed').each(function () {
				$(this).css('height', wh * 1 + 'px');
			});
		}
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
		this.els.$galleryGrid.find('li.thumb').on('click', $.proxy(this.clickGalleryThumbnail, this));
	},

	initLazyLoading: function () {
		$('.gallery-grid li:not(.thumb-more) img.lazy-load, .artist-list img.lazy-load').lazyload({
			effect : 'fadeIn'
		});
		$('.gallery-grid .thumb img.lazy-load').lazyload({
			effect : 'fadeIn',
			event : 'galleryLoadMore'
		});
	},

	scrollToAnchor: function (e) {
		this.toggleMenu(false);
		e.preventDefault();
		$('html, body').animate({
			scrollTop: this.els.$main.find( $(e.target).attr('href')).position().top
		}, 800);
	},

	registerAnimatedPaths: function () {
		var _this = this,
			defaultLimits = { top: 0, bottom: this.documentHeight };
		this.animatedPaths = []; // TODO: move above

		d3.selectAll('.page-block .animated-line').each(function (d, j) {
			var path = d3.select(this),
				pathLen = path.node().getTotalLength(),
				blockLimits = $(this).closest('.page-block').data(),
				diff,
				top;

			if ( typeof blockLimits.top === 'undefined' || typeof blockLimits.bottom === 'undefined' ) {
				blockLimits = defaultLimits;
			}

			top = blockLimits.top + (_this.windowHeight / 2);
			diff = blockLimits.bottom - top;

			path.attr("stroke-dasharray", pathLen + " " + pathLen)
				.attr("stroke-dashoffset", pathLen);

			_this.animatedPaths.push({
				d3el: path,
				len: pathLen,
				top: top,
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

		this.els.$header.toggleClass('sticky', scrollTop > (this.windowHeight - 80) );

		if ( this.windowWidth >= this.mobileWidth ) {
			this.animatePaths(stwh);
			this.fixfloatingBlocks(stwh);
		}
	},

	animatePaths: function (stwh) { // stwh: scroll top + window height
		var listLen = this.animatedPaths.length,
			offset = 120,
			path,
			len,
			perc;
		for ( var i = 0 ; i < listLen ; i++ ) {
			path = this.animatedPaths[i];
			if ( stwh >= (path.top - offset) && stwh <= (path.bottom + offset) ) {
				perc = (stwh - path.top) / path.diff;
				if ( perc < 0 ) {
					perc = 0;
				}
				else if ( perc > 1 ) {
					perc = 1;
				}
				len = path.len;
				path.d3el.transition()
					.duration(60)
					.ease("linear")
					.attr('stroke-dashoffset', len - (len * perc));
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

	toggleMenu: function (opt) {
		this.els.$nav.toggleClass('unfold', opt);
	},

	unfoldGalleryGrid: function () {
		this.els.$galleryGrid.find('.thumb img.lazy-load').trigger('galleryLoadMore');
		this.els.$galleryGrid.toggleClass('show-all', true);

		this.registerAllAnimatedElements();
	},

	toggleNavBar: function ( show ) {
		this.els.$header.toggleClass('hidden', !show);
	},

	clickGalleryThumbnail: function (e) {
		e.preventDefault();
		this.openGallery($(e.currentTarget));
	},

	openGallery: function (currentTarget) {
		var _this = this,
			$gallery = this.els.$galleryGrid,
			pswpElement = document.querySelectorAll('.pswp')[0],
			items = [],
			idx = null,
			currentTargetImgSrc = currentTarget.find('img').attr('src'),
			$this,
			$a,
			options,
			size;

		$gallery.find('li.thumb').filter(':visible').each(function (itemIdx) {
			$this = $(this);

			$a = $this.find('figure a');
			size = $a.data('size').split('x');

			// create slide object
			items.push({
				el: $this,
				src: $a.attr('href'),
				msrc: $this.find('img').attr('src'),
				w: parseInt(size[0], 10),
				h: parseInt(size[1], 10)
			});

			if ( $this.find('img').attr('src') === currentTargetImgSrc ) {
				idx = itemIdx;
			}
		});

		options = {
			index: idx || 0,

			// define gallery index (for URL)
			galleryUID: $gallery.data('pswp-uid'),

			getThumbBoundsFn: function(index) {
				// See Options -> getThumbBoundsFn section of documentation for more info
				var thumbnail = items[index].el.find('img')[0], // find thumbnail
					pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
					rect = thumbnail.getBoundingClientRect();

				return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
			}

		};

		this.gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);

		this.gallery.init();
		this.toggleNavBar(false);

		this.gallery.listen('close', function() {
			_this.toggleNavBar(true);
		});
		this.gallery.listen('destroy', function() {
			_this.gallery = null;
		});
	}
}

app.init();
