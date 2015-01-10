var app = {

	els: {
		$veil: null,
		$main: null
	},

	registerElements: function () {
		this.els.$veil   = $('section#veil');
		this.els.$main   = $('section#main');
		this.els.$header = $('.header-container');

		this.els.$galleryGrid = this.els.$main.find('.gallery-grid');
		this.els.$galleryBtn  = this.els.$main.find('.gallery-more');

		this.els.$galleryBtn.on('click', $.proxy(this.unfoldGalleryGrid, this));
	},

	init: function () {
		this.registerElements();
		this.initialCalculations();
		this.initialLoad();
		this.registerAnimatedBlocks();
	},

	initialCalculations: function () {
		this.windowHeight = $(window).outerHeight(true);
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
		that.setBlockTops();
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
		this.els.$main.find('section#landing').css('height', this.windowHeight + 'px');
	},

	setBlockTops: function () {
		/*this.startOffset = this.windowHeight / 2;

		for ( var i = 0 ; i < 3 ; i++ ) {

			var blockTop = $('.page-block-' + i).position().top;

			this.blocks[i].start = blockTop - this.startOffset;
			this.blocks[i].end   = (blockTop * 1.5) - this.startOffset;
		}*/
	},

	registerAnimatedBlocks: function () {
	},

	appScroll: function () {
		var scrollTop = $(window).scrollTop();

		this.els.$header.toggleClass('shown', scrollTop > 300 );
	},

	unfoldGalleryGrid: function () {
		this.els.$galleryGrid.toggleClass('show-all', true);
		this.els.$galleryBtn.css({ 'display': 'none' });
	}

}

app.init();
