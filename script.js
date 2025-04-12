window.addEventListener('DOMContentLoaded', () => {
	new ImagePlayer(document.querySelectorAll('[data-imageplayer]'), { roop: true, count: true, wait: 100 });
});

class ImagePlayer {

	constructor(anchors, options = {}) {
		// arguments
		this._anchors = anchors || [];
		this._roop = options.roop || false;
		this._count = options.count || false;
		this._wait = options.wait || 250;
		// variables
		this._currentIndex = null;
		this._currentCategory = null;
		this._currentAnchors = [];
		this._currentAnchor = null;
		this._currentX = null;
		this._isSliding = false;
		// createElement
		this._dialog = document.createElement('dialog');
		this._centerBlock = document.createElement('div');
		this._headerBlock = document.createElement('div');
		this._footerBlock = document.createElement('div');
		this._countText = document.createElement('div');
		this._headerText = document.createElement('div');
		this._footerText = document.createElement('div');
		this._currentBlock = document.createElement('div');
		this._prevBlock = document.createElement('div');
		this._nextBlock = document.createElement('div');
		this._currentImage = document.createElement('img');
		this._prevImage = document.createElement('img');
		this._nextImage = document.createElement('img');
		this._closeButton = document.createElement('button');
		this._prevButton = document.createElement('button');
		this._nextButton = document.createElement('button');
		// classList
		this._dialog.classList.add('imageplayer-dialog');
		this._centerBlock.classList.add('imageplayer-centerblock');
		this._headerBlock.classList.add('imageplayer-headerblock');
		this._footerBlock.classList.add('imageplayer-footerblock');
		this._countText.classList.add('imageplayer-counttext');
		this._headerText.classList.add('imageplayer-headertext');
		this._footerText.classList.add('imageplayer-footertext');
		this._currentBlock.classList.add('imageplayer-imageblock');
		this._prevBlock.classList.add('imageplayer-imageblock');
		this._nextBlock.classList.add('imageplayer-imageblock');
		this._currentImage.classList.add('imageplayer-image');
		this._prevImage.classList.add('imageplayer-image');
		this._nextImage.classList.add('imageplayer-image');
		this._closeButton.classList.add('imageplayer-closebutton');
		this._nextButton.classList.add('imageplayer-nextbutton');
		this._prevButton.classList.add('imageplayer-prevbutton');
		// addEventListener
		this._anchors.forEach((e, i) => e.addEventListener('click', this.open.bind(this, i)));
		this._dialog.addEventListener('mousewheel', this.mousewheel.bind(this));
		this._centerBlock.addEventListener('mousedown', this.mousedown.bind(this), {capture:true});
		this._centerBlock.addEventListener('mouseup', this.mouseup.bind(this), {capture:true});
		this._centerBlock.addEventListener('touchstart', this.touchstart.bind(this), {capture:true});
		this._centerBlock.addEventListener('touchend', this.touchend.bind(this), {capture:true});
		this._closeButton.addEventListener('click', this.close.bind(this));
		this._nextButton.addEventListener('click', this.next.bind(this));
		this._prevButton.addEventListener('click', this.prev.bind(this));
		document.addEventListener('keydown', this.keydown.bind(this));
		// setProperty
		this._dialog.style.setProperty('--imageplayer-wait', this._wait + 'ms');
		this._countText.style.setProperty('opacity', this._count ? 1 : 0);
		// append
		this._dialog.append(this._headerBlock, this._centerBlock, this._footerBlock);
		this._centerBlock.append(this._prevBlock, this._currentBlock, this._nextBlock);
		this._headerBlock.append(this._countText, this._headerText, this._closeButton);
		this._footerBlock.append(this._prevButton, this._footerText, this._nextButton);
		this._currentBlock.append(this._currentImage);
		this._prevBlock.append(this._prevImage);
		this._nextBlock.append(this._nextImage);
		document.body.append(this._dialog);
	}

	wait(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	stop(event) {
		event.preventDefault();
		event.stopPropagation();
	}

	async open(index, event) {
		this.stop(event);
		this._currentCategory = this._anchors[index].dataset.imageplayer;
		this._currentAnchors = Array.from(this._anchors).filter(e => e.dataset.imageplayer === this._currentCategory);
		this._currentAnchor = this._anchors[index];
		this._currentIndex = Array.from(this._currentAnchors).indexOf(this._currentAnchor);
		this.update(this._currentIndex);
		this._dialog.showModal();
		await this.wait(this._wait);
		if (!event.pointerType) this._closeButton.focus();
	}

	async close(event) {
		this.stop(event);
		this._dialog.close();
		await this.wait(this._wait);
		this._currentIndex = null;
		this._currentCategory = null;
		this._currentAnchors = [];
		this._currentAnchor = null;
		this._currentX = null;
		this._isSliding = false;
		this._countText.textContent = '';
		this._headerText.textContent = '';
		this._footerText.textContent = '';
		this._currentBlock.dataset.blur = false;
		this._prevBlock.dataset.blur = false;
		this._nextBlock.dataset.blur = false;
		this._currentImage.tabIndex = -1;
		this._currentImage.dataset.blur = false;
		this._nextImage.dataset.blur = false;
		this._prevImage.dataset.blur = false;
		this._currentImage.src = '';
		this._prevImage.src = '';
		this._nextImage.src = '';
	}

	update(index) {
		const length = this._currentAnchors.length - 1;
		this._currentIndex = index < 0 ? length : index > length ? 0 : index;
		this._currentAnchor = this._currentAnchors[this._currentIndex];
		const header = this._currentAnchor.dataset.header || '';
		const footer = this._currentAnchor.dataset.footer || '';
		this.updateImage(this._currentIndex, this._currentImage, this._currentBlock);
		this.updateImage(this._currentIndex - 1, this._prevImage, this._prevBlock);
		this.updateImage(this._currentIndex + 1, this._nextImage, this._nextBlock);
		this._countText.textContent = '';
		this._headerText.textContent = '';
		this._footerText.textContent = '';
		this._countText.insertAdjacentHTML('beforeend', (this._currentIndex + 1) + ' / ' + (this._currentAnchors.length));
		this._headerText.insertAdjacentHTML('beforeend', header.replaceAll('\\n', '<br>'));
		this._footerText.insertAdjacentHTML('beforeend', footer.replaceAll('\\n', '<br>'));
		this._prevButton.disabled = !this._roop && this._currentIndex === 0;
		this._nextButton.disabled = !this._roop && this._currentIndex === this._currentAnchors.length - 1;
		this._currentAnchor.scrollIntoView({block:'center'});
	}

	async updateImage(index, image, block) {
		if (index < 0) index = this._currentAnchors.length - 1;
		if (index > this._currentAnchors.length - 1) index = 0;
		const anchor = this._currentAnchors[index];
		const blur = anchor.dataset.blur === 'true';
		image.src = '';
		image.src = anchor;
		image.dataset.blur = blur;
		block.dataset.blur = blur;
		block.tabIndex = blur ? 0 : -1;
		while(image.complete) await this.wait(1);
	}

	prev() {
		if (this._isSliding || this._prevButton.disabled) return false;
		this.slide(true);
	}

	next() {
		if (this._isSliding || this._nextButton.disabled) return false;
		this.slide(false);
	}

	async slide(isPrev) {
		const index = isPrev ? -1 : 1;
		const translate = isPrev ? '100cqw' : '-100cqw';
		this._isSliding = true;
		this._centerBlock.style.setProperty('transition', 'var(--imageplayer-wait)');
		this._centerBlock.style.setProperty('translate', translate);
		await this.wait(this._wait);
		this._centerBlock.style.setProperty('transition', 'none');
		this._centerBlock.style.setProperty('translate', 'none');
		this.update(this._currentIndex + index);
		this._isSliding = false;
	}

	mousewheel(event) {
		if (this._isSliding) return false;
		this.stop(event);
		if (event.deltaY < 0) return this.prev(event);
		if (event.deltaY > 0) return this.next(event);
	}

	mousedown(event) {
		if (event.button !== 0 || this._isSliding) return false;
		this.stop(event);
		this._currentX = event.clientX;
	}

	mouseup(event) {
		if (event.button !== 0 || this._isSliding) return false;
		this.stop(event);
		const x = this._currentX - event.clientX;
		this._currentX = null;
		if (x < 0) return this.prev(event);
		if (x > 0) return this.next(event);
		if (event.target === this._centerBlock) return this.close(event);
		if (event.target === this._currentBlock || event.target === this._currentImage) return this.blur();
	}

	touchstart(event) {
		if (this._isSliding) return false;
		this.stop(event);
		this._currentX = event.changedTouches[0].clientX;
	}

	touchend(event) {
		if (this._isSliding) return false;
		this.stop(event);
		const x = this._currentX - event.changedTouches[0].clientX;
		this._currentX = null;
		if (x < 0) return this.prev(event);
		if (x > 0) return this.next(event);
		if (event.target === this._centerBlock) return this.close(event);
		if (event.target === this._currentBlock || event.target === this._currentImage) return this.blur();
	}

	keydown(event) {
		if (this._dialog.hidden || this._sliding) return false;
		if (event.key === 'Escape') return this.close(event);
		if (event.key === 'ArrowLeft') return this.prev(event);
		if (event.key === 'ArrowRight') return this.next(event);
		if (event.key === 'ArrowUp') return this.prev(event);
		if (event.key === 'ArrowDown') return this.next(event);
		if (event.key === 'Enter' && document.activeElement === this._currentBlock) return this.blur();
	}

	blur() {
		if (this._currentBlock.dataset.blur !== 'true') return false;
		this._currentImage.dataset.blur = this._currentImage.dataset.blur !== 'true';
	}

}
