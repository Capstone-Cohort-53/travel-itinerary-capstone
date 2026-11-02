import {type RouteConfig, index, route, layout} from "@react-router/dev/routes";

export default [
    layout ('layouts/navbar.tsx',[
    index("routes/home/home.tsx"),
    // add new pages above this line, e.g. route("about", "routes/about/about.tsx"),
route ('/my-trips','routes/my-trips/my-trips.tsx'),
    // catch-all: any URL with no matching route renders the 404 page
    route("*", "routes/not-found/not-found.tsx")
        ])
] satisfies RouteConfig;