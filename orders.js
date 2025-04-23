@@ -0,0 +1,92 @@
const cuid = require('cuid')
const db = require('./db')

const Order = db.model('Order', {
  _id: { type: String, default: cuid },
  buyerEmail: { type: String, required: true },
  products: [{
    type: String,
    ref: 'Product', // ref will automatically fetch associated products for us
    index: true,
    required: true
  }],
  status: {
    type: String,
    index: true,
    default: 'CREATED',
    enum: ['CREATED', 'PENDING', 'COMPLETED']
  }
})

async function list(options = {}) {

  const { offset = 0, limit = 25, productId, status } = options;

  const productQuery = productId ? {
    products: productId
  } : {}

  const statusQuery = status ? {
    status: status
  } : {}

  const query = {
    ...productQuery,
    ...statusQuery
  }

  const orders = await Order.find(query)
    .sort({ _id: 1 })
    .skip(offset)
    .limit(limit)

  return orders
}

async function get (_id) {
  // using populate will automatically fetch the associated products.
  // if you don't use populate, you will only get the product ids
  const order = await Order.findById(_id)
    .populate('products')
    .exec()

  return order
}

async function create (fields) {
  const order = await new Order(fields).save()
  await order.populate('products')
  return order
}

async function edit(_id, changes) {
    const updatedOrder = await Order.findByIdAndUpdate(
      _id,
      changes,
      { new: true } // Ensures the returned document is the updated one
    )
      .populate('products') // Populates the `products` field with associated data
      .exec();

    if (!updatedOrder) {
      throw new Error(`Order with id ${_id} not found`);
    }

    return updatedOrder;
  }

  async function destroy(_id) {
    const deletedOrder = await Order.findByIdAndDelete(_id).exec();

    if (!deletedOrder) {
      throw new Error(`Order with id ${_id} not found`);
    }
  }

module.exports = {
    create,
    get,
    list,
    edit,
    destroy
}
