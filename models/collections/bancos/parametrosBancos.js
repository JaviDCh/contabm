

ParametrosBancos = new Mongo.Collection("parametrosBancos");

let schema = new SimpleSchema({
     _id: { type: String, optional: false },

     retencionSobreIvaFlag: { type: Boolean, label: "Retención sobre Iva", optional: true },
     retencionSobreIvaPorc: { type: Number, label: "Retención sobre Iva - Porcentaje", decimal: true, optional: true },
     footerFacturaImpresa_L1: { type: String, label: "Pié de facturas (impresas)", optional: true },
     footerFacturaImpresa_L2: { type: String, label: "Pié de facturas (impresas)", optional: true },
     footerFacturaImpresa_L3: { type: String, label: "Pié de facturas (impresas)", optional: true },

     aplicarITF: { type: Boolean, label: "Aplicar ITF", optional: true },
     cuentaContableITF: { type: Number, label: "Cuenta contable para el ITF", optional: true },

     cia: { type: Number, label: "Cia Contab", optional: false },
     docState: { type: Number, optional: true },
});

ParametrosBancos.attachSchema(schema);
