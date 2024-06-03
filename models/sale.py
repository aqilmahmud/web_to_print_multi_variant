# -*- coding: utf-8 -*-
##############################################################################
# Copyright (c) 2015-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>)
# See LICENSE file for full copyright and licensing details.
# License URL : <https://store.webkul.com/license.html/>
##############################################################################

import logging

from odoo import _, api, fields, models
from odoo.http import request
from odoo.tools.image import image_process

_logger = logging.getLogger(__name__)

class SaleOrderLine(models.Model):
    _inherit = 'sale.order.line'

    web_to_print_line = fields.Boolean(string='',copy=True)
    design_line_ids = fields.One2many('line.custom.design', 'line_id', copy=True)

    def action_url_web_to_print_design(self):
        view = self.env.ref('web_to_print.sale_order_line_view_form_web').id
        return {
            'type':'ir.actions.act_window',
            'res_model':'sale.order.line',
            'res_id':self.id,
            'view_mode':'form',
            'view_id':view,
            'target':'self'
        }

class DesignLine(models.Model):
    _name = 'line.custom.design'
    _description = 'custom design lines'

    name = fields.Char(string='')
    line_id = fields.Many2one('sale.order.line', string='')
    design = fields.Binary(string='')
    text = fields.Html(string='')
    image = fields.Binary(string='')
    image_name = fields.Char()

    def action_download_design(self):
        self.ensure_one()
        return {
            'type':'ir.actions.act_url',
            'url': f'/web/image/line.custom.design/{self.id}/design?download=True&mimetype=PNG',
        }
    
    def action_report_design_content(self):
        return self.env.ref('web_to_print.action_report_web_to_print_design').report_action(self)

class SaleOrder(models.Model):
    _inherit = 'sale.order'
    
    def _cart_update(self, product_id=None, line_id=None, add_qty=0, set_qty=0, **kwargs):
        if request.context.get('web_to_print'):
            line_id = False
        elif line_id == None:
            line = self.env['sale.order.line'].search([('order_id','=',self.id),('product_id','=',product_id),('web_to_print_line','=',False)])
            if line:line_id = line.id
            else:line_id = False
        res = super(SaleOrder,self)._cart_update(product_id,line_id,add_qty,set_qty,**kwargs)
        if request.context.get('web_to_print'):
            line = self.env['sale.order.line'].browse(res['line_id'])
            content = request.context.get('design_content')
            if line:
                line.write({
                    'web_to_print_line':True,
                    'design_line_ids':content
                })
        return res
    