// console.log("Hello World");

interface Product {
  id: number;
  name: string;
  price: number;
}

const products: Product[] = [
  { id: 1, name: "Product 1", price: 10 },
  { id: 2, name: "Product 2", price: 20 },
  { id: 3, name: "Product 3", price: 30 },
  { id: 4, name: "Product 4", price: 40 },
];

console.log(products);

/*  


Client 


Server

*/

import express from "express";
import type { Request, Response } from "express";

const app = express();

const PORT = 3000;

app.get("/", (req, res) => {
  console.log("Welcome to my node app ");

  // req: Request  is what you are sending to the server containes a lot of this

  // res: Response data you will get from the server

  console.log("Request object ", req);

  return res.send("Welcome to my node app ");
});

app.get("/products", (req: Request, res: Response) => {
  console.log(req.hostname);

  return res.send({
    products: products,
  });
});

app.listen(PORT, () => {
  console.log("Server is up and running on port " + PORT);
});
