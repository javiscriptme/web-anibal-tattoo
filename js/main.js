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
		this.els.$galleryBtn.on('click', $.proxy(this.unfoldGalleryGrid, this));
	},

	init: function () {
		this.registerElements();
		this.initialCalculations();
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

	firstLoadCallback: function () {
		var that = this;

		// Setting '.page-block' position as relative so veil fading effect works properly
		this.els.$main.find('.page-block').css('position', 'relative');
		this.setBlockTops();
		this.registerAnimatedPaths();
		this.registerAnimatedBlocks();
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
	}

}

app.init();
