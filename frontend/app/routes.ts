import { type RouteConfig, index, route } from "@react-router/dev/routes";




export default [
    index("routes/home/home.tsx"),
    // add new pages above this line, e.g. route("about", "routes/about/about.tsx"),

    route('/travel-itinerary', 'routes/travel-itinerary/travel-itinerary.tsx'),
    // catch-all: any URL with no matching route renders the 404 page
    route("*", "routes/not-found/not-found.tsx"),
] satisfies RouteConfig;