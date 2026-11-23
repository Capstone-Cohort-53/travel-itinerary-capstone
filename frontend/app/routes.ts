import {type RouteConfig, index, route, layout} from "@react-router/dev/routes";

export default [
    layout ('layouts/navbar.tsx',[
    index("routes/home/home.tsx"),
    // add new pages above this line, e.g. route("about", "routes/about/about.tsx"),
route ('/my-trips','routes/my-trips/my-trips.tsx'),
    route('/create-trip','routes/create-trip/create-trip.tsx'),
route('/travel-itinerary/:id/activity/new','routes/activity/activity.tsx'),
    route('/travel-itinerary/:id/activity/:activityId/edit','routes/activity/edit-activity.tsx'),
    route('/travel-itinerary/:id/activity/:activityId','routes/activity-details.tsx'),
    route('/trip-itinerary/:tripId', 'routes/trip-itinerary/trip-itinerary.tsx'),

    route('/travel-itinerary/:id', 'routes/travel-itinerary/travel-itinerary.tsx'),
    route('/profile', 'routes/profile/profile.tsx'),
    route('/profile/:id', 'routes/profile/view-profile.tsx'),
    route('accept-invitation/:token','routes/accept-invitation/accept-invitation.tsx'),

    // catch-all: any URL with no matching route renders the 404 page
    route("*", "routes/not-found/not-found.tsx")
        ]),
    route ('api/sign-in','routes/api/sign-in/sign-in.tsx'),
] satisfies RouteConfig;