# -*- coding: utf-8 -*-
##############################################################################
# Copyright (c) 2015-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>)
# See LICENSE file for full copyright and licensing details.
# License URL : <https://store.webkul.com/license.html/>
##############################################################################
import logging,base64
from werkzeug.exceptions import NotFound

from odoo import http
from odoo.http import request
from odoo.addons.website.controllers.main import QueryURL
from odoo.addons.website_sale.controllers.main import WebsiteSale


_logger = logging.getLogger(__name__)

class WebsiteSale(WebsiteSale):

    @http.route(['/custom/design/<model("product.product"):product>'],auth="public",type="http",website=True, sitemap=False)
    def wtp_custom_product(self,product,**kwargs):
        if not product.is_web_to_print:
            raise NotFound()
        ir_default = request.env['ir.default'].sudo()
        tnc = ir_default._get('res.config.settings','wtp_enable_tnc')
        if tnc:
            wtp_tnc = ir_default._get('res.config.settings','wtp_tnc_text')
        keep = QueryURL('/shop')
        return request.render('web_to_print.custom_product',{
            'product':product,
            'keep':keep,
            'wtp_tnc':wtp_tnc if tnc else False
        })

    @http.route()
    def cart_update(self, product_id, add_qty=1, set_qty=0, product_custom_attribute_values=None, no_variant_attribute_values=None,express=False, **kwargs):
        if kwargs.get('web_to_print_order') == 'True':
            ctx = request.context.copy()
            product = request.env['product.product'].browse(int(product_id))
            content = [
                (0,0,
                        {
                            'design':kwargs.get('web_to_print_area_%s_design'%area.id).split(',')[1],
                            'text':kwargs.get('web_to_print_area_%s_text'%area.id) if kwargs.get('web_to_print_area_%s_text'%area.id) != 'False' else False,
                            'image':kwargs.get('web_to_print_area_%s_image'%area.id).split(',')[1] if kwargs.get('web_to_print_area_%s_image'%area.id) != 'False' else False,
                            'image_name':kwargs.get('web_to_print_area_%s_image_name'%area.id) if kwargs.get('web_to_print_area_%s_image_name'%area.id) != 'False' else False,
                            'name':area.name,
                        } ) for area in product.custom_area_ids if kwargs.get('web_to_print_area_%s_design'%area.id) != ''
            ]
            ctx.update(design_content=content,web_to_print=True)
            request.update_context(**ctx)
        res = super(WebsiteSale,self).cart_update(product_id,add_qty,set_qty,product_custom_attribute_values, no_variant_attribute_values,express, **kwargs)
        if kwargs.get('web_to_print_order') == 'True':
            return request.redirect('/shop/cart')   
        return res
