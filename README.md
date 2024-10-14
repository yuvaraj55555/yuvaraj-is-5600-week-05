# Lab 05 | Fullstack Prints Part 2

## Overview

During this lab, we will be introduced to Mongodb and connect our products service to a database. We will also be introduced to the Mongoose library, which is a library that allows us to interact with our MongoDB database. The goal of the lab is to add database persistence to our products service and work with Postman to test our API endpoints.

## Instructions

1. For this lab, we begin where we left off on the previous lab, and add database persistence to our products service. Luckily, we already have a pretty module application. Open the replit lab and review the following files:

- `app.js`: This is the main application file. It is responsible for setting up the express application and starting the server.
- `api.js`: This file contains the routes for the products service. It is responsible for handling requests to our endpoints.
- `products.js`: This file contains the products service. It is responsible for handling the business logic for our products service.

2. Let's begin by modifying the `Products.create()` route handler. Open up the `api.js` file and modify your `createProduct` route handler to look like the following:

```js
/**
 * Create a new product
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
async function createProduct (req, res, next) {
  const product = await Products.create(req.body)
  res.json(product)
}
```

Now, this won't work of course, because the `Products.create()` method doesn't exist. Before we implement it though, we should create a new module to handle our database. This will allow us to separate our database logic from our application logic. Create a new file called `db.js` and add the following code:

```js
// db.js
const mongoose = require('mongoose')

mongoose.connect(
  process.env.MONGODB_URI || 'mongodb+srv://<username>:<password>@is-5600-23-01.pipsfpg.mongodb.net/?retryWrites=true&w=majority', // Note you'll need to put in your own credentials here
  {
    useNewUrlParser: true,
  }
)

module.exports = mongoose
```

This assumes you've already created your MongoDB database via MongoDB Atlas. You'll need the connection string to put in the `db.js` file. If you have not created this yet, please watch the video outlining how to.
3. Now, let's begin work on our products model. Open up the `products.js` file, and add the following code:

```js
// products.js
const cuid = require('cuid')

const db = require('./db')

// Define our Product Model
const Product = db.model('Product', {
  _id: { type: String, default: cuid },
  description: { type: String },
  alt_description: { type: String },
  likes: { type: Number, required: true },
  urls: {
    regular: { type: String, required: true },
    small: { type: String, required: true },
    thumb: { type: String, required: true },
  },
  links: {
    self: { type: String, required: true },
    html: { type: String, required: true },
  },
  user: {
    id: { type: String, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String },
    portfolio_url: { type: String },
    username: { type: String, required: true },
  },
  tags: [{
    title: { type: String, required: true },
  }], 
})
```

This command tells `mongoose` which collection in MongoDB to user, and it controls what kinds of properties the documents in teh collection should have. By default, `mongoose` will prevent use from persisting any properties absent from the schema object. This is a good thing, because it prevents us from accidentally saving data that we don't want to save.

So with our mongoose model defined, we can now implement the `Products.create()` method. Open up the `products.js` file and add the following code:

```js
// products.js
/**
 * Create a new product
 * @param {Object} product
 * @returns {Promise<Object>}
 */
async function create (fields) {
  const product = await new Product(fields).save()
  return product
}
```

What we are doing here is creating the product in memory first using the `new Product(fields)`. Then we are calling the async method `save()` which will persist the product to the database. The `save()` method returns a promise, so we can use the `await` keyword to wait for the promise to resolve. Once the promise resolves, we can return the product.
Finally, update the module exports to include the `create()` method.

Now we can restart our Replit lab, and test out the create products endpoint in Postman. Open post man make a `POST` request to the `/products` endpoint. You can find two example objects in the `data/product1.json` and `data/product2.json` files. Use these with Postman and create a `POST` request to verify that your API endpoint works correctly. If working correctly, you should see a response with the product that you created. If you open up the Mongo DB Atlas dashboard, you should see the product that you created in the database. This can be found under Database > Browse Collections > products.

4. Now that we have the `create()` method working, let's refactor our `list()` method in the products service module to retrieve our data from the database. Open up the `products.js` file and update the `list()` method to look like the following:

```js
// products.js
/**
 * List products
 * @param {Object} query
 * @returns {Promise<Object[]>}
 */
async function list (options = {}) {
  const { offset = 0, limit = 25, tag } = options

  // Use a ternary statement to create the query object. Then pass 
  // the query object to Mongoose to filter the products
  const query = tag ? {
    tags: {
      $elemMatch: {
        title: tag
      }
    }
  } : {}
  const products = await Product.find(query)
    .sort({ _id: 1 })
    .skip(offset)
    .limit(limit)
    
  return products
}
```

In the above snippet, the `list` method is extracting the `tag` query parameter, which is used to filter the products. The function then uses the `.find()` method to query the products collection and returns all the products that have a `tag` object with a `title` property that matches the tag parameter passed to the function.

_Note_ We use `sort({ _id: 1 })` to sort the products by their `_id` property. This is a good practice because it will ensure that the products are returned in the same order every time. Each of our products using a `cuid` as its `_id`, and if we use this to sort, we'll return our products in the order of their creation.

While we are here, let's refactor that `get()` method as well:

```js
// products.js

/**
 * Get a product
 * @param {String} _id
 * @returns {Promise<Object>}
 */
async function get (_id) {
  const product = await Product.findById(_id)
  return product
}
```

If you haven't already, rebuild your Replit lab and checkout the webview - you should see the products that you created in the database.

5. Next, we need to implement edit and delete functionality. This will be fairly straight forward. Let's begin with the `api.js` file. Open up the `api.js` file and add the following code:

```js
// api.js

/**
 * Update a product
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
async function editProduct (req, res, next) {
  const change = req.body
  const product = await Products.edit(req.params.id, change)
  res.json(product)
}

/**
 * Delete a product
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
async function deleteProduct (req, res, next) {
  const response = await Products.destroy(req.params.id)
  res.json(response)
}
```

And create the corresponding methods in the `products.js` module. Add the following code to the `products.js` file:

```js
// products.js

/**
 * Edit a product
 * @param {String} _id
 * @param {Object} change
 * @returns {Promise<Object>}
 */
async function edit (_id, change) {
  const product = await get(_id)

  // todo can we use spread operators here?
  Object.keys(change).forEach(function (key) {
    product[key] = change[key]
  })
  
  await product.save()

  return product
}

/**
 * Delete a product
 * @param {String} _id
 * @returns {Promise<Object>}
 */
async function destroy (_id) {
  return await Product.deleteOne({_id})
}
```

Great! Now export these functions and you can now rebuild the lab, and test out your edit and delete endpoints. Using postman you should be able to submit a DELETE request or a PUT request with modified data.

7. Now that we have the products module working, let's go ahead and import some data to the database. We've included a script that will read the `data/products.json` file and import the data into the database. This script can be found in the `scripts/import-products.js` file. To run the script, open up the Replit terminal and run the following command:

```bash
node scripts/import-products.js
```

Once the script is complete, you can verify that it worked by checking the Mongo DB Atlas dashboard. You should see the products that were imported into the database.

8. To finalize our app's backend, we need to be able to handle more than just products. If this is to be an eCommerce app, we need to be able to take orders for products as well. For the next few steps, we will create an `orders` module, and add similar endpoints as we did above. We will also ensure that there is a relationship between
the orders and the products. When our customers create an order, we want to make sure that the order tracks the products a user has purchased.

So let's begin by registering the `orders` routes with the express server. Open up the `app.js` file and add the following code:

```js
// app.js

// ...

app.get('/orders', api.listOrders)
app.get('/orders/', api.createOrder)
```

Then open up the `api.js` file and register the following route handlers.

```js
// api.js

/**
 * Create an order
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
async function createOrder (req, res, next) {
  const order = await Orders.create(req.body)
  res.json(orders)
}

/**
 * List orders
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
async function listOrders (req, res, next) {
  const { offset = 0, limit = 25, productId, status } = req.query

  const orders = await Orders.list({ 
    offset: Number(offset), 
    limit: Number(limit),
    productId, 
    status 
  })

  res.json(orders)
}
```

Don't forget to export these functions from the `api.js` file.

9. Now, the next step is to create our Orders module. Create a new file called `orders.js`. Add the following snippets to the file:

```js
// orders.js
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

/**
 * List orders
 * @param {Object} options
 * @returns {Promise<Array>}
 */
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

/**
 * Get an order
 * @param {Object} order
 * @returns {Promise<Object>}
 */
async function get (_id) {
  // using populate will automatically fetch the associated products.
  // if you don't use populate, you will only get the product ids
  const order = await Order.findById(_id)
    .populate('products')
    .exec()
  
  return order
}

/**
 * Create an order
 * @param {Object} order
 * @returns {Promise<Object>}
 */
async function create (fields) {
  const order = await new Order(fields).save()
  await order.populate('products')
  return order
}

```

10. Excellent - now we have an orders module, which will allow us to create new orders and list orders. Now, we will need to more CRUD functionality to the `orders` module, for instance updating and deleting. This will be your task to be completed independently.

## Your Task

1. We need to be able to update an existing order. Create a new method in the `orders.js` module called `edit()`. This method should take an `_id` and a `change` object. The method should update the order with the given `_id` with the new values in the `change` object. The method should return the updated order. You can use the `edit()` method in the `products.js` module as a reference.
2. We need to be able to delete an existing order. Create a new method in the `orders.js` module called `destroy()`. This method should take an `_id` and delete the order with the given `_id`. The method should not return a value. Again, you can use the `destroy()` method in the `products.js` module as a reference.
3. For both of these new endpoints, we need to register them with the express server. Make sure they are registered in the `app.js` file similarly to how the `products` endpoints are registered.

## Extra Credit

1. Refactor the `edit()` method to use the spread operator without mutating state. This would look something like this:

```js
const newObject = {...existingObject, ...change}
```

## Guidance and Testing

1. This lab will require Postman to test endpoints. You can download Postman [here](https://www.postman.com/downloads/). Refer to the previous labs for guidance on how to use Postman.
2. This lab will require Mongo DB Atlas. There is a free tier that you can use. You can sign up for a free account [here](https://www.mongodb.com/cloud/atlas). Refer to the previous accompanying video in Canvas for guidance on how to use Mongo DB Atlas.

- make sure you add IP address from anywhere

## Submission

Once you have completed the lab, please submit your code to the Replit classroom. You can do this by clicking the "Share" button in the top right corner of the Replit editor. Then, click the "Share to Classroom" button. You should see a list of classes that you are enrolled in. Select the class that you are enrolled in and click the "Share" button. You should see a message that your code has been shared with the class. You can now close the share window.
