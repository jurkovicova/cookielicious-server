import express from "express"
import cors from "cors"
import Db from 'mysql2-async'




const app = express();

export const db = new Db({
    host: "localhost",
    user: "root",
    password: "NqY4mxzqRUFFG",
    database: "Order system",
    skiptzfix: true

});

app.use(express.json())
app.use(cors())


app.get("/", (req, res) => {
    res.json("Hello this is backend")
})

// ##### Customer Handler #####
async function getCustomers() {
    try {
        const data = await db.query("SELECT * FROM customers");
        return data; // Assuming data is returned as rows
    } catch (error) {
        throw new Error("Failed to fetch customers from database");
    }
}

app.get("/cust", async (_, res) => {
    try {
        const customers = await getCustomers();
        res.json(customers); // Send the customers data as JSON response
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ error: "Failed to fetch customers" });
    }
});


// ###### Order Handler #####
app.get("/order", async (req, res) => {
    try {
        const data = await db.query("SELECT * from item")
        res.json(data)
    } catch (error) {
        console.error("Error fetching items");
        res.status(500).json({ error: "Failed to fetch items" });
    }

})


app.post("/order", async (req, res) => {

    let cust_id;
    try {
        const email = req.body.email; // Assuming email is sent in the request body
        // Check if customer with the provided email already exists
        const existingCustomer = await findCustomerByEmail(email);

        if (!existingCustomer) {
            //createNewCustomer
            console.log("New customer addition")
            const cust_values = [req.body.cust_firstname, req.body.cust_lastname, req.body.email]
            await db.query("INSERT INTO customers (`cust_firstname`,`cust_lastname`,`email`) VALUES (?)", [cust_values])
            cust_id = await db.query("SELECT customer_id FROM customers WHERE email = (?)", email)
            cust_id = cust_id[0]['customer_id']
        } else {
            cust_id = existingCustomer.customer_id
        }


        const q = "INSERT INTO orders (`order_id`,`created_at`,`delivery_at`,`item_id`,`item_quant`, `cust_id`, `delivery`, `add_id`) VALUES (?)"

        const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Get current date-time in ISO format
        const formattedCurrentDate = currentDate.replace(' ', 'T'); // Replace space with 'T' for MySQL DATETIME format
        const orderId = generateOrderId();

        const values = [
            orderId,
            formattedCurrentDate,
            formattedCurrentDate,
            req.body.item_id,
            req.body.item_quant,
            cust_id,
            req.body.delivery,
            req.body.add_id
        ]

        
        const data = db.query(q, [values])
        return res.json(data)

    } catch (error) {
        console.error("Error processing order:", error);
        return res.status(500).json({ error: "Failed to process order" });
    }


})

app.listen(8800, () => {
    console.log("You are connected!")
})


// ### ADDITIONAL FUNCTION ####
function generateOrderId() {
    const timestamp = new Date().getTime(); // Get current timestamp in milliseconds
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
        console.error("Error accessing database:", error);
    }
}




