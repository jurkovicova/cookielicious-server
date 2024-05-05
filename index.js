import express from 'express';
import cors from 'cors';
import Db from 'mysql2-async';

const app = express();

export const db = new Db({
	host: 'localhost',
	user: 'root',
	password: 'NqY4mxzqRUFFG',
	database: 'Order system',
	skiptzfix: true,

});

app.use(express.json());
app.use(cors());

app.get('/', (request, res) => {
	res.json('Hello this is backend');
});

// ##### Customer Handler #####
app.get('/cust', async (_, res) => {
	try {
		const customers = await getCustomers();
		res.json(customers); // Send the customers data as JSON response
	} catch (error) {
		console.error('Error fetching customers:', error);
		res.status(500).json({error: 'Failed to fetch customers'});
	}
});

// ###### Order Handler #####
app.get('/order', async (request, res) => {
	try {
		const data = await db.query('SELECT * from item');
		res.json(data);
	} catch {
		console.error('Error fetching items');
		res.status(500).json({error: 'Failed to fetch items'});
	}
});

app.post('/order', async (request, res) => {
	// Here validate the req input
	try {
		let cust_id = null;

		cust_id = await getCustomerId(request);

		const q = 'INSERT INTO orders (`order_id`,`created_at`,`delivery_at`,`item_name`,`item_quant`, `cust_id`, `delivery`) VALUES (?)';

		const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Get current date-time in ISO format
		const formattedCurrentDate = currentDate.replace(' ', 'T'); // Replace space with 'T' for MySQL DATETIME format
		const orderId = generateOrderId();

		const values = [
			orderId,
			formattedCurrentDate,
			formattedCurrentDate,
			request.body.item_name,
			request.body.item_quant,
			cust_id,
			1,
		];

		await db.query(q, [values]);
		return res.json({message: 'Order created successfully'});
	} catch (error) {
		console.error('Error creating order:', error);
		return res.status(500).json({error: 'An error occurred while creating the order'});
	}
});

app.listen(8800, () => {
	console.log('You are connected!');
});

// ### ADDITIONAL FUNCTION ####
function generateOrderId() {
	const timestamp = Date.now(); // Get current timestamp in milliseconds
	const randomComponent = Math.floor(Math.random() * 1000); // Generate a random number between 0 and 9999
	return `${'O'}${timestamp}${randomComponent}`; // Combine timestamp and random number to form order_id
}

async function findCustomerByEmail(email) {
	try {
		// Fetch all customers
		const customers = await getCustomers();
		// Find customer with the provided email
		const customer = customers.find(c => c.email === email);
		return customer; // Return the found customer or null if not found
	} catch (error) {
		console.error('Error accessing database:', error);
	}
}

async function getCustomers() {
	try {
		const data = await db.query('SELECT * FROM customers');
		return data; // Assuming data is returned as rows
	} catch {
		throw new Error('Failed to fetch customers from database');
	}
}

async function getCustomerId(request) {
	let cust_id;
	const email = request.body.email;

	// Check if customer with the provided email already exists
	const existingCustomer = await findCustomerByEmail(email);

	if (existingCustomer) {
		cust_id = existingCustomer.customer_id;
	} else {
		// Create new customer
		console.log('New customer addition');
		const cust_values = [request.body.cust_firstname, request.body.cust_lastname, request.body.email];
		await db.query('INSERT INTO customers (`cust_firstname`,`cust_lastname`,`email`) VALUES (?)', [cust_values]);
		const result = await db.query('SELECT customer_id FROM customers WHERE email = (?)', [email]);
		cust_id = result[0].customer_id;
	}

	console.log(cust_id);
	return cust_id;
}

