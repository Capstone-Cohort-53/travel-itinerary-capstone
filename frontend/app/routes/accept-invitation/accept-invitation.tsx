import {Button, Card, TextInput} from "flowbite-react";


export type User = {
    id: string,
    cellNumber: number
    email: string,
    name: string,
    going: string,
    children: number,
    adults: number,
}

export type Trip = {
    userId: string,
    id: string,
    title: string,
    destination: string,
    startDate: string,
    endDate: string,
}


export default function AcceptInvite() {
     //use camelcase eg camelCase, sql use snake case eg camel_case
    const organizer: User = {
        id: 'lsljdlhfsdlfkjd',
        name: 'Monica',
        cellNumber: 8675307,
        email: 'email7@email.com',
        going: 'yes',
        children: 5,
        adults: 3,
    };

    const trip: Trip = {
        userId: 'hello',
        id: 'lsfhsljfowon',
        title: 'Going to Las Vegas for Monica',
        destination: 'Las Vegas, NV',
        startDate: 'Oct 9',
        endDate: 'Nov 2'
    };

    return (

<div className="bg-[url('/bg_reduced.jpeg')] bg-cover bg-right bg-no-repeat">



{/*need to link title for You are invited to text*/}
        <section className={'gap-6 auto rounded-xl min-h-screen container mx-auto max-w-md '}>

            <h1 className={'text-4xl font-bold tracking-wider text-white'}>Accept Invitation</h1>

            <Card href="#" className=" mt-8 hover:bg-[#FFF0F1]">
                <h5 className="text-2xl font-bold tracking-tight text-gray-500">
                    You are invited!
                </h5>

                <p className="font-bold text-lg text-gray-700">
                    {trip.title}
                </p>
                <p className="font-bold text-lg text-gray-700">
                    Invited by {organizer.name}
                </p>
                <div className="flex gap-4">
                    <p className="font-bold text-lg text-gray-700  ">
                        Destination: {trip.destination}
                    </p>
                </div>
                <div>
                    <p className="font-normal text-lg text-gray-700 ">
                        Trip Start Date: {trip.startDate}
                    </p>
                    <p className="font-normal text-lg text-gray-700 ">
                        Trip End Date: {trip.endDate}
                    </p>
                </div>


            </Card>


            <Card href="#" className=" mt-8 mx-auto max-w-md hover:bg-[#FFF0F1]">
                <form className="flex max-w-md flex-col gap-4">
                    <div>
                        <div className="mb-2 block">
                            <h5 className="text-2xl font-bold tracking-tight text-gray-500">Create an account to
                                accept your invitation and join {trip.title} !</h5>
                        </div>

                        <div className="flex gap-3 mb-2 block">

                            <Button
                                className="w-1/2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-1.5 px-3 rounded-lg transition-colors"
                                type="submit">Sign Up</Button>

                            <Button
                                className="w-1/2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-1.5 px-3 rounded-lg transition-colors">Log
                                In</Button>


                        </div>


                        <p className="font-normal text-gray-700 ">
                            Full Name *
                        </p>
                        <TextInput id="email2" type="email" placeholder="[Your Name]" required shadow/>

                        <p className="font-normal text-gray-700 ">
                            Email Address *
                        </p>
                        <TextInput id="email2" type="email" placeholder="[name@flowbite.com]" required shadow/>

                        <p className="font-normal text-gray-700 ">
                            Password *
                        </p>
                        <TextInput id="email2" type="email" placeholder="[Create Password]" required shadow/>


                    </div>
                    <Button className="bg-[#FD6B6C] hover:bg-red-600" type="submit">Sign Up and Accept
                        Invitation</Button>

                    <p className="font-normal text-gray-700 ">
                        Already have an account? Select Log In to accept your invitation.
                    </p>

                    <p className="font-normal text-gray-700 ">
                        ---------------------------------------------------
                    </p>

                    <p className="font-normal text-gray-700 ">
                        After acceptance, open the trip to view the itinerary and attendance.
                    </p>

                </form>
            </Card>


        </section>

    )
        </div>
    )}