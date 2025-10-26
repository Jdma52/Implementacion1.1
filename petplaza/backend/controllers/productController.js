const Product = require("../models/Product");

// Crear producto
const createProduct = async (req, res) => {
  try {
    const { name, category, quantity, price, minStock, provider, purchaseDate, expiryDate } = req.body;

    const product = new Product({
      name,
      category,
      quantity,
      price,
      minStock,
      provider,
      purchaseDate,
      expiryDate,
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ mensaje: "Error creando producto", error: err.message });
  }
};

// Obtener productos
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ mensaje: "Error obteniendo productos", error: err.message });
  }
};

// Actualizar producto
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ mensaje: "Producto no encontrado" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ mensaje: "Error actualizando producto", error: err.message });
  }
};

// Eliminar producto
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ mensaje: "Producto no encontrado" });
    res.json({ mensaje: "Producto eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ mensaje: "Error eliminando producto", error: err.message });
  }
};

module.exports = { createProduct, getProducts, updateProduct, deleteProduct };
