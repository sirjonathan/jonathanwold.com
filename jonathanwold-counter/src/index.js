/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
   async fetch(request, env) {
	 const url = new URL(request.url);
	 const path = url.pathname;

	 const key = `views:${path}`;
	 let views = await env.PAGE_VIEWS.get(key);
	 views = views ? parseInt(views) : 0;

	 if (request.method === "POST") {
	   views += 1;
	   await env.PAGE_VIEWS.put(key, views.toString());
	 }

	 return new Response(JSON.stringify({ views }), {
	   headers: {
		   "Content-Type": "application/json",
		   "Access-Control-Allow-Origin": "*",
	   }
	 });
   }
 };
