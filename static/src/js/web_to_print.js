/** @odoo-module **/
/* Copyright (c) 2015-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>) */
/* See LICENSE file for full copyright and licensing details. */
/* License URL : <https://store.webkul.com/license.html/> */
import { WebsiteSale } from '@website_sale/js/website_sale';
import { debounce } from "@web/core/utils/timing";
import { registry } from "@web/core/registry";
import publicWidget from "@web/legacy/js/public/public_widget";
var canvas_drawing_objects = {}, canvas_texts = {}, canvas_imgs = {}, resize_ratio = {};
import { whenReady } from "@odoo/owl";


WebsiteSale.include({

	_submitForm: function () {
		if (this.$form.find('input[name^="web_to_print"]')) {
			var formvals = {};
			$('input[name^="web_to_print"]').each(input => {
				var $input = $(this);
				formvals[`${$input.attr('name')}`] = $input.val();
			})
			$.extend(this.rootProduct, formvals);
		}
		return this._super.apply(this, arguments);
	}
});

export const webToPrint = {

	start() {

		whenReady(() => {

			$('#customize-link').click(ev => {
				var pid = $(ev.currentTarget).closest('form').find('input[name="product_id"]').val();
				console.log("PID:", pid)
				window.location.href = '/custom/design/' + pid.toString();
			});


			if ($('.wk_canvas').length) {

				function webToPrintInitialize() {
					$('.wk_loader').show();
					$('.wk_canvas').each(function () {
						var node = $(this);
						var drawing = node.find('canvas');
						canvas_drawing_objects[`obj_drawing_${drawing.data('area-id')}`] = new fabric.Canvas(drawing.attr('id'));
					});
					// setCanvasProperties();
					function objectMoving(e) {
						var obj = e.target;
						if (obj.currentHeight > obj.canvas.height || obj.currentWidth > obj.canvas.width) {
							return;
						}
						obj.setCoords();
						if (obj.getBoundingRect().top < 0 || obj.getBoundingRect().left < 0) {
							obj.top = Math.max(obj.top, obj.top - obj.getBoundingRect().top);
							obj.left = Math.max(obj.left, obj.left - obj.getBoundingRect().left);
						}
						if (obj.getBoundingRect().top + obj.getBoundingRect().height > obj.canvas.height || obj.getBoundingRect().left + obj.getBoundingRect().width > obj.canvas.width) {
							obj.top = Math.min(obj.top, obj.canvas.height - obj.getBoundingRect().height + obj.top - obj.getBoundingRect().top);
							obj.left = Math.min(obj.left, obj.canvas.width - obj.getBoundingRect().width + obj.left - obj.getBoundingRect().left);
						}
					}
					$.each(canvas_drawing_objects, function () {
						this.on('object:moving', objectMoving);
						var id = $(this.getElement()).data('area-id');
						canvas_texts[`obj_text${id}`] = null;
						canvas_imgs[`obj_img${id}`] = null;
					});
					$('.wk_loader').hide();
				}
				webToPrintInitialize();

				function objectSelected(ev) {
					var activeObject = canvas.getActiveObject();
					if (activeObject && activeObject.type === 'text') {
						$('#text-string').val(activeObject.text);
					}
				}


				$.each(canvas_drawing_objects,function () {
					this.on('object:scaling', objectScaling);
				})

				$.each(canvas_drawing_objects,function () {
					this.on('object:moving', objectMoving);

				})

				function objectMoving(ev){
					let { id } = getActiveCanvas();
					var obj = ev.target ? ev.target : ev
					var cords = obj._getLeftTopCoords();

					if (obj.type === 'text') {
						resize_ratio[`object_top${id}`]= cords['y']/obj.canvas.height
						resize_ratio[`object_left${id}`]= cords['x']/obj.canvas.width
					}

					if (obj.type === 'image') {
						resize_ratio[`object_top_img${id}`]= cords['y']/obj.canvas.height
						resize_ratio[`object_left_img${id}`]= cords['x']/obj.canvas.width

					}

				}


				function objectScaling(ev) {
					let { id } = getActiveCanvas();
					var obj = ev.target ? ev.target : ev

					if (obj.type === 'text') {

						const maxTextWidth = obj.canvas.width * 0.95;
						const maxTextHeight = obj.canvas.height * 0.95;
						const currentTextWidth = obj.getScaledWidth();
						const currentTextHeight = obj.getScaledHeight();

						resize_ratio[`object_scaleX${id}`]= obj.scaleX
						resize_ratio[`object_scaleY${id}`]= obj.scaleY

						if (currentTextWidth > maxTextWidth || currentTextHeight > maxTextHeight ) {
							objectResize(obj)
							}
					}

					if (obj.type === 'image') {
						const maxImageWidth = obj.canvas.width * 0.90;
						const maxImageHeight = obj.canvas.height * 0.90;
						const currentImageWidth = obj.getScaledWidth();
						const currentImageHeight = obj.getScaledHeight();

						resize_ratio[`object_scaleX_img${id}`]= obj.scaleX
						resize_ratio[`object_scaleY_img${id}`]= obj.scaleY

						if (currentImageWidth > maxImageWidth || currentImageHeight > maxImageHeight ) {
							objectResize(obj)
							}
					}
				}


				function objectResize(ev) {
					let { id } = getActiveCanvas();
					var obj = ev.target ? ev.target : ev

					if (obj.type === 'text') {
						const maxTextWidth = obj.canvas.width * 0.95;
						const maxTextHeight = obj.canvas.height * 0.95;
						const currentTextWidth = obj.getScaledWidth();
						const currentTextHeight = obj.getScaledHeight();

						obj.set('top', resize_ratio[`object_top${id}`] * obj.canvas.height );
						obj.set('left', resize_ratio[`object_left${id}`] * obj.canvas.width);

						// Check if the current text width exceeds the maximum width
						if (currentTextWidth >= maxTextWidth) {
						const newScaleX = maxTextWidth / obj.getScaledWidth() * obj.scaleX;
						obj.set('scaleX', newScaleX);
						}

						// Check if the current text Height exceeds the maximum Height
						if (currentTextHeight >= maxTextHeight) {
							const newScaleY = maxTextHeight / obj.getScaledHeight() * obj.scaleY;
							obj.set('scaleY', newScaleY);
							}

					}

					if (obj.type === 'image') {
						const maxImageWidth = obj.canvas.width * 0.90;
						const maxImageHeight = obj.canvas.height * 0.90;
						const currentImageWidth = obj.getScaledWidth();
						const currentImageHeight = obj.getScaledHeight();

						obj.set('top', resize_ratio[`object_top_img${id}`] * obj.canvas.height );
						obj.set('left', resize_ratio[`object_left_img${id}`] * obj.canvas.width);

						// Check if the current Image width exceeds the maximum width
						if (currentImageWidth >= maxImageWidth) {
						const newScaleX = maxImageWidth / obj.getScaledWidth() * obj.scaleX;
						obj.set('scaleX', newScaleX);
						}

						// Check if the current Image Height exceeds the maximum Height
						if (currentImageHeight >= maxImageHeight) {
							const newScaleY = maxImageHeight / obj.getScaledHeight() * obj.scaleY;
							obj.set('scaleY', newScaleY);
							}
					}



				}

				function getActiveCanvas() {
					var node = $('.wk_canvas.tab-pane.active');
					var id = node.data('area-id');
					var canvas= canvas_drawing_objects[`obj_drawing_${id}`]
					var drawingarea= node.find('.drawingArea')

					if (!(`width-${id}` in resize_ratio) && !(`height-${id}` in resize_ratio) && !(`top-${id}` in resize_ratio) && !(`left-${id}` in resize_ratio)) {
						resize_ratio[`width-${id}`] = canvas.getWidth()
						resize_ratio[`height-${id}`] = canvas.getHeight()
						resize_ratio[`top-${id}`] = drawingarea.css('top')
						resize_ratio[`left-${id}`] = drawingarea.css('left')
					  }

					return {
						canvas: canvas_drawing_objects[`obj_drawing_${id}`],
						id,
						node,
						drawingarea: node.find('.drawingArea')
					};
				}

				$('#generate-players-btn').click(function () {
					var numRows = parseInt($('#num-rows-input').val());
					var dynamicRowsContainer = $('#dynamic-rows-container');
				
					dynamicRowsContainer.empty(); // Clear previous rows
				
					for (var i = 0; i < numRows; i++) {
						var row = $('<div class="row"></div>');
				
						var nameInputColumn = $('<div class="col-md-4 mb-2"></div>');
						var jerseyInputColumn = $('<div class="col-md-4 mb-2"></div>');
						var sizeInputColumn = $('<div class="col-md-4 mb-2"></div>');
				
						var nameInput = $('<input type="text" class="form-control" placeholder="Enter name" name="name[]">');
						var jerseyInput = $('<input type="number" class="form-control" placeholder="Enter jersey number" name="jersey_number[]">');
						var sizeSelect = $('<select class="form-control" name="size[]"><option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option></select>');
				
						nameInputColumn.append(nameInput);
						jerseyInputColumn.append(jerseyInput);
						sizeInputColumn.append(sizeSelect);
				
						row.append(nameInputColumn);
						row.append(jerseyInputColumn);
						row.append(sizeInputColumn);
				
						dynamicRowsContainer.append(row);
					}
				});				

				var textCounter = 0;

				$('.add-text').click(function (ev) {
				let { canvas, id, node, drawingarea } = getActiveCanvas();
				var text = $(ev.currentTarget).prev('.text-string').val();
				$(ev.currentTarget).prev('.text-string').val(''); // Clear the text area
				textCounter++;  // Increment the counter for each new text object

				var canvas_text = new fabric.Text(text, {
					left: fabric.util.getRandomInt(0, drawingarea.width()),
					top: fabric.util.getRandomInt(0, drawingarea.height()),
					fontFamily: 'helvetica',
					angle: 0,
					fill: '#000000',
					scaleX: 0.5,
					scaleY: 0.5,
					fontWeight: '',
					hasRotatingPoint: true
				});

				canvas.add(canvas_text);
				canvas_texts[`obj_text${id}_${textCounter}`] = canvas_text;  // Use unique key for each text object
				resize_ratio[`object_scaleX${id}_${textCounter}`] = canvas_text.scaleX;
				resize_ratio[`object_scaleY${id}_${textCounter}`] = canvas_text.scaleY;
				canvas_text.set('scaleX', (canvas_text.canvas.width / resize_ratio[`width-${id}`]) * resize_ratio[`object_scaleX${id}_${textCounter}`]);
				canvas_text.set('scaleY', (canvas_text.canvas.height / resize_ratio[`height-${id}`]) * resize_ratio[`object_scaleY${id}_${textCounter}`]);
				objectResize(canvas_text);
				canvas.centerObject(canvas_text);
				var cords = canvas_text._getLeftTopCoords();
				resize_ratio[`object_top${id}_${textCounter}`] = cords['y'] / canvas_text.canvas.height;
				resize_ratio[`object_left${id}_${textCounter}`] = cords['x'] / canvas_text.canvas.width;
				canvas.item(canvas.item.length - 1).hasRotatingPoint = true;
			});

			$('.text-string').keydown(debounce(ev => {
				let { canvas, id, node } = getActiveCanvas();
				var canvas_text = canvas_texts[`obj_text${id}`];
				var activeObject = canvas.getActiveObject();
				if (canvas_text) {

					canvas_text.set({ 'text': $(ev.currentTarget).val() });
					objectResize(canvas_text);
					canvas.renderAll();
				}
			}, 300));

			function objectDeselected(ev) {
			}

			$(document).on('input', '.add-img', ev => {
				let { canvas, id, node, drawingarea } = getActiveCanvas();
				var img = $(ev.currentTarget);
				if (img[0].files.length == 0) {
					alert('Please select image first');
				}
				else {
					if (!(img[0].files[0].type.split('/')[0] === 'image')) {
						$("#cautionfileAlert").toast('show');
					}
					else {
						var reader = new FileReader();
						reader.readAsDataURL(img[0].files[0]);
						reader.onload = function () {
							fabric.Image.fromURL(reader.result, function (image) {
								image.set({
									left: fabric.util.getRandomInt(0, drawingarea.width() / 2),
									top: fabric.util.getRandomInt(0, drawingarea.height() / 2),
									angle: 0,
									padding: 10,
									cornersize: 10,
									hasRotatingPoint: true
								});
								//image.scale(getRandomNum(0.1, 0.25)).setCoords();
								image.scaleToHeight(100);
								image.scaleToWidth(100);
								if (canvas_imgs[`obj_img${id}`])
									canvas.remove(canvas_imgs[`obj_img${id}`]);
								canvas.add(image);

								var cords = image._getLeftTopCoords()
								resize_ratio[`object_top_img${id}`]= cords['y']/image.canvas.height
								resize_ratio[`object_left_img${id}`]= cords['x']/image.canvas.width

								resize_ratio[`object_scaleX_img${id}`]= image.scaleX
								resize_ratio[`object_scaleY_img${id}`]= image.scaleY
								image.set('scaleX', (image.canvas.width/resize_ratio[`width-${id}`])*resize_ratio[`object_scaleX_img${id}`])
								image.set('scaleY', (image.canvas.height/resize_ratio[`height-${id}`])*resize_ratio[`object_scaleY_img${id}`]);

								objectResize(image)
								canvas_imgs[`obj_img${id}`] = image;
								$(`#add-to-cart-modal input[name="web_to_print_area_${id}_image_name"]`).val(img[0].files[0].name);
								img.next('.img-name').html(img[0].files[0].name);

							});
						};
					}
				}
			});

			$(document).on('click', ".text-bold", function () {
				let { canvas, id, node } = getActiveCanvas();
				var canvas_text = canvas_texts[`obj_text${id}`];
				var activeObject = canvas.getActiveObject();
				if (activeObject && activeObject.type === 'text') {
					activeObject.fontWeight = (activeObject.fontWeight == 'bold' ? '' : 'bold');
					canvas.renderAll();
				}
				else if (canvas_text) {
					canvas_text.fontWeight = (canvas_text.fontWeight == 'bold' ? '' : 'bold');
					canvas.renderAll();
				}
			});

			$(document).on('click', ".text-italic", function () {
				let { canvas, id, node } = getActiveCanvas();
				var canvas_text = canvas_texts[`obj_text${id}`];
				var activeObject = canvas.getActiveObject();
				if (activeObject && activeObject.type === 'text') {
					activeObject.fontStyle = activeObject.fontStyle == "italic" ? '' : "italic";
					canvas.renderAll();
				}
				else if (canvas_text) {
					canvas_text.fontStyle = canvas_text.fontStyle == "italic" ? '' : "italic";
					canvas.renderAll();
				}

			});

			$(document).on('input', '.color-input', function (ev) {
				let { canvas, id, node } = getActiveCanvas();
				var canvas_text = canvas_texts[`obj_text${id}`];
				var activeObject = canvas.getActiveObject();
				if (activeObject && activeObject.type === 'text') {
					activeObject.set({ 'fill': ev.currentTarget.value });
					canvas.renderAll();
				}
				else if (canvas_text) {
					canvas_text.set({ 'fill': ev.currentTarget.value });
					canvas.renderAll();
				}
			});

			$('.font-family + ul li a').click(function () {
				let { canvas, id, node } = getActiveCanvas();
				var canvas_text = canvas_texts[`obj_text${id}`];
				var activeObject = canvas.getActiveObject();
				if (activeObject && activeObject.type === 'text') {
					activeObject.set({
						'fontFamily': $(this).text().toString()
					});
					canvas.renderAll();
				}
				else if (canvas_text) {
					canvas_text.set({
						'fontFamily': $(this).text().toString()
					});
					canvas.renderAll();
				}
			});

			$(".text-strike").click(function () {
				let { canvas, id, node } = getActiveCanvas();
				var canvas_text = canvas_texts[`obj_text${id}`];
				var activeObject = canvas.getActiveObject();
				if (activeObject && activeObject.type === 'text') {
					activeObject.set({
						'linethrough': (activeObject.linethrough == true ? false : true)
					});
					canvas.renderAll();
				}
				else if (canvas_text) {
					canvas_text.set({
						'linethrough': (canvas_text.linethrough == true ? false : true)
					});
					canvas.renderAll();
				}
			});

			$(".text-underline").click(function () {
				let { canvas, id, node } = getActiveCanvas();
				var canvas_text = canvas_texts[`obj_text${id}`];
				var activeObject = canvas.getActiveObject();
				if (activeObject && activeObject.type === 'text') {
					activeObject.set({
						'underline': (activeObject.underline == true ? false : true)
					});
					canvas.renderAll();
				}
				else if (canvas_text) {
					canvas_text.set({
						'underline': (canvas_text.underline == true ? false : true)
					});
					canvas.renderAll();
				}
			});

			$(document).on('click', '.rm-text', ev => {
				let { canvas, id, node, drawingarea } = getActiveCanvas();
				if (textCounter > 0) {
					let textKey = `obj_text${id}_${textCounter}`;
					if (canvas_texts[textKey]) {
						canvas.remove(canvas_texts[textKey]);
						canvas_texts[textKey] = null;
						textCounter--; // Decrement the counter
					}
				}
			});
			

			$(document).on('click', '.rm-img', ev => {
				let { canvas, id, node, drawingarea } = getActiveCanvas();
				if (canvas_imgs[`obj_img${id}`]) {
					canvas.remove(canvas_imgs[`obj_img${id}`]);
					canvas_imgs[`obj_img${id}`] = null;
					$(`#add-to-cart-modal input[name="web_to_print_area_${id}_image_name"]`).val('False');
					$(ev.currentTarget).closest('.row').find('.img-name').html('');

				}
			});

			$(document).on('click', '.col-5 .cart-small-img', ev => {
				$(ev.currentTarget).closest('.row').prev('.row').find('.col-7 img').attr('src', ev.currentTarget.src);
			});


			$('#reset-design').click(function (ev) {
				let { canvas, id, node } = getActiveCanvas();
				canvas_texts[`obj_text${id}`] = null;
				canvas_imgs[`obj_img${id}`] = null;
				$(`#add-to-cart-modal input[name="web_to_print_area_${id}_image_name"]`).val('False');
				canvas.clear();
				$('.img-name').html('');

			});

			$('.nav-link.wk-img').click(ev => {
				$('.tab-pane.editor.active').removeClass('active');
				var id = $(ev.currentTarget).data('area-id');
				$(`.tab-pane.editor[id='area_${id}']`).addClass('active');
				setInterval(resizeCanvas, 100);
				// resizeCanvas();
			});

			function get_design_url() {
				let { canvas, id, node, drawingarea } = getActiveCanvas();

				var	image_div = $(`#area_${id}`).children('.img-canvas')[0],
					image = $(image_div).children('img')[0],
					actualWidth = image.naturalWidth,
					ratioL = actualWidth / parseInt(resize_ratio[`left-${id}`],10);

				canvas.discardActiveObject();
				canvas.renderAll();
				var img = node.find('img');
				var prev_value = drawingarea.position();
				var can = document.createElement("canvas");
				can.width = img.width();
				can.height = img.height();
				var bottlectx = can.getContext('2d');
				bottlectx.drawImage(img.get(0), 0, 0, img.width(), img.height());
				bottlectx.drawImage(canvas.getElement(), $(image).width() / ratioL, prev_value.top, canvas.getWidth(), canvas.getHeight());
				return can.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");

			}

			function getTextHtml(text) {
				if (text) {
					var html = $('<div/>', {
						'text': text.text,
						css: {
							'font-weight': text.fontWeight,
							'font-style': text.fontStyle,
							'font-family': text.fontFamily,
							'text-decoration': text.linethrough ? 'line-through' : 'none',
							'color': text.fill
						}

					})
					if (text.underline) {
						$(html).wrapInner('<u></u>');
					}
					return html[0].outerHTML;
				}
				else return null
			}

			function getAllDesign() {
				var hasDesign = false;
				var cr_canvas = $('.wk_canvas.active');
				$('.wk_canvas').each(function () {
					var node = $(this);
					var id = node.data('area-id');
					var canvas = canvas_drawing_objects[`obj_drawing_${id}`];

					var	image_div = $(`#area_${id}`).children('.img-canvas')[0],
						image = $(image_div).children('img')[0],
						actualWidth = image.naturalWidth,
						ratioL = actualWidth / parseInt(resize_ratio[`left-${id}`],10);

					if (!canvas.isEmpty()) {
						canvas.discardActiveObject();
						canvas.renderAll();
						hasDesign = true;
						node.addClass('active');
						var img = node.find('img');
						var drawingarea = node.find('.drawingArea');
						drawingarea.show();
						var prev_value = drawingarea.position();
						var can = document.createElement("canvas");
						can.width = img.width();
						can.height = img.height();
						var bottlectx = can.getContext('2d');
						bottlectx.drawImage(img.get(0), 0, 0, img.width(), img.height());
						bottlectx.drawImage(canvas.getElement(), $(image).width() / ratioL, prev_value.top, canvas.getWidth(), canvas.getHeight());
						$(`#add-to-cart-modal input[name="web_to_print_area_${id}_design"]`).val(can.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream"));
						$(`#add-to-cart-modal input[name="web_to_print_area_${id}_text"]`).val(canvas_texts[`obj_text${id}`] ? getTextHtml(canvas_texts[`obj_text${id}`]) : 'False');
						$(`#add-to-cart-modal input[name="web_to_print_area_${id}_image"]`).val(canvas_imgs[`obj_img${id}`] ? canvas_imgs[`obj_img${id}`].getSrc() : 'False')
						var img = new Image();
						img.src = can.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
						img.className = 'border mt8 mr8 ml8 cart-small-img';
						img.style = 'width:50px;height:50px;cursor:pointer';
						$('#add-to-cart-modal .col-md-6 .col-5').last().append(img);
					}
				});
				$('.wk_canvas').removeClass('active');
				cr_canvas.addClass('active');
				return hasDesign;
			}

			$('#save-design').click(ev => {
				$('.wk_loader').show();
				$('#add-to-cart-modal .col-md-6 .col-5').last().empty();
				var hasDesign = getAllDesign();
				if (!hasDesign) {
					$('.wk_loader').hide();
					ev.stopPropagation();
					$('#add-cart-msg').show().delay(3000).hide(1);
					$('#add-to-cart-modal').modal('hide');
					return;
				}
				var img = new Image();
				img.src = $('.cart-small-img').first().attr('src');
				img.className = 'img-thumbnail';
				$('#add-to-cart-modal .col-md-6 .col-7').first().empty();
				$('#add-to-cart-modal .col-md-6 .col-7').first().append(img);
				// $('.cart-small-img').length == 1 ? $('.cart-small-img').remove() : '';
				$('.wk_loader').hide();
			});

			$('#preview-design').click(function (ev) {
				var modal = $('#preview-design-modal img');
				modal.attr('src', get_design_url());
				$('#preview-design-modal').modal('show');
			});
			
			$('#design-download').click(function () {
				var dbtn = document.createElement('a');
				dbtn.href = get_design_url();
				dbtn.download = 'design.jpeg';
				dbtn.click();
			});

			$(document).on('input', '.web-to-print-confirm', ev => {
				var $input = $(ev.currentTarget);
				if ($input.is(':checked'))
					$input.closest('div').next('#buy_now').removeClass('disabled');
				else
					$input.closest('div').next('#buy_now').addClass('disabled');
			});


			function resizeCanvas () {
				let { canvas, id, node, drawingarea} = getActiveCanvas();
				var	image_div = $(`#area_${id}`).children('.img-canvas')[0],
					image = $(image_div).children('img')[0],
					actualWidth = image.naturalWidth,
					actualHeight = image.naturalHeight,
					ratioW = actualWidth / resize_ratio[`width-${id}`] ,
					ratioH = actualHeight/ resize_ratio[`height-${id}`] ,
					ratioT = actualHeight / parseInt(resize_ratio[`top-${id}`], 10),
					ratioL = actualWidth / parseInt(resize_ratio[`left-${id}`],10);

					var new_canvas_width = $(image).width() / ratioW
					var new_canvas_height =$(image).height() / ratioH
					var new_left = ((($(`#area_${id}`).width()-$(image).width())/2)+($(image).width() / ratioL))
				canvas.setWidth(new_canvas_width);
				canvas.setHeight(new_canvas_height);

				$.each(canvas.getObjects(),function () {
					objectResize(this)
					})

				drawingarea.css(({"width":$(image).width() / ratioW, "height":$(image).height() / ratioH , "top":$(image).height() / ratioT,"left":new_left, }))
				canvas.renderAll();
				};



				// Resize board
				$(window).resize(resizeCanvas);

			}

		});

		// return canvas_drawing_objects

	},

	canvas_drawing_objects : canvas_drawing_objects,

};

registry.category("services").add("web_to_print", webToPrint);

// 	return canvas_drawing_objects
// });
