var app = {

	els: {
		$veil: null,
		$main: null
	},

	registerElements: function () {
		this.els.$veil   = $('section#veil');
		this.els.$main   = $('section#main');
		this.els.$header = $('.header-container');
	},

	init: function () {
		this.registerElements();
		this.initialCalculations();
		this.initialLoad();
//		this.registerAnimatedBlocks();
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
		this.els.$veil.toggleClass('hide', true);

		this.scrollLock = true;
		$(window).scroll(function () {
			that.scrollLock = false;
		});

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

	registerAnimatedBlocks: function () {
		var that = this;

		this.blocks = [];
		this.startOffset = 60;

		for ( var i = 0 ; i < 6 ; i++ ) {

			this.blocks[i] = {
				start: this.windowHeight * i - this.startOffset,
				end: this.windowHeight * i + this.windowHeight / 2 - this.startOffset,
				lines: []
			};

			d3.selectAll('.page-block-' + i + ' .animated-line').each(function (d, j) {
				var blockLine = d3.select(this);
				var lineLen = blockLine.node().getTotalLength();

				blockLine.attr("stroke-dasharray", lineLen + " " + lineLen)
					.attr("stroke-dashoffset", lineLen);

				that.blocks[i].lines.push( { d3el: blockLine, len: lineLen } );

			});

		}

	},

	appScroll: function () {
		var scrollTop = $(window).scrollTop();

		this.els.$header.toggleClass('shown', scrollTop > 300 );

		return;
		for ( var i = 0 ; i < 6 ; i++ ) {
			if ( scrollTop >= this.blocks[i].start && scrollTop <= (this.blocks[i].end + 200) ) {
				var perc = (scrollTop - this.blocks[i].start) / (this.blocks[i].end - this.blocks[i].start) * 100;
				console.log('%c limit: %o - %o', "color: white; background: lime;", i, this.blocks[i].end - scrollTop );
				if ( perc < 0 ) { perc = 0; } else if ( perc > 100 ) { perc = 100; }
				this.animateBlockSvgLines(this.blocks[i].lines, perc);
			}
		}
	},

	animateBlockSvgLines: function (lines, perc) {
		var numLines = lines.length;
		for ( var i = 0 ; i < numLines ; i++ ) {
			var len = lines[i].len;
			lines[i].d3el.transition()
				.duration(60)
				.ease("linear")
				.attr('stroke-dashoffset', len - (len * perc / 100));
		}
	}

}

app.init();
