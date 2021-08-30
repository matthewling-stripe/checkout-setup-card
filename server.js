/**
* This is the main Node.js server script for your project
* Check out the two endpoints this back-end API provides in fastify.get and fastify.post below
*/

const path = require("path");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: true,
});

// ADD FAVORITES ARRAY VARIABLE FROM TODO HERE

// Setup our static files
const fastify_static = require('fastify-static');

fastify.register(fastify_static, {
  root: path.join(__dirname, "public"),
  prefix: "/" // optional: default '/'
});

fastify.register(fastify_static, {
  root: path.join(__dirname, 'src'),
  prefix: "/src/",
  decorateReply: false,
});

// fastify-formbody lets us parse incoming forms
fastify.register(require("fastify-formbody"));

// point-of-view is a templating manager for fastify
fastify.register(require("point-of-view"), {
  engine: {
    handlebars: require("handlebars")
  }
});

// Load and parse SEO data
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

/**
* Our home page route
*
* Returns src/index.hbs with data built into it
*/
fastify.get("/", (request, reply) => {
  // params is an object we'll pass to our handlebars template
  let params = { 
    seo,
    publicKey: process.env.STRIPE_PUBLIC_KEY,    
    showOutput: true,
    showConsole: true,
    projectDomain: process.env.PROJECT_DOMAIN,
  };
  
  // The Handlebars code will be able to access the parameter values and build them into the page
  reply.view("/src/index.hbs", params);
});

fastify.get("/config", function(request, reply) {
  // params is an object we'll pass to our handlebars template
  request.log.info("Sending the publishable key");
  reply.send({ publishableKey: process.env.STRIPE_PUBLIC_KEY });
});

fastify.post("/create-checkout-session", async function(request, reply) {
  request.log.info("Creating checkout session");

  const customer = await stripe.customers.create({
    name: "Jenny Rosen",
    email: "jenny@example.com"
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "setup",
    customer: customer.id,
    success_url: `${process.env.BASE_URI}?success=true`,
    cancel_url: `${process.env.BASE_URI}?cancel=true`
  });

  request.log.info(session);

  reply.send({ sessionId: session.id });
});

// Run the server and report out to the logs
fastify.listen(process.env.PORT, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
  fastify.log.info(`server listening on ${address}`);
});
