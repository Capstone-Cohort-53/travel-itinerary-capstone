import {Button, Card, TextInput} from "flowbite-react";


export default function AcceptInvite() {

    return (


//need to link title for You are invited to text
<section className={'gap-6 auto rounded-xl my-8'}>

    <h1 className={'text-2xl font-bold tracking-tight text-gray-500'}>Accept Invitation</h1>

    <Card href="#" className=" mt-8 hover:bg-[#FFF0F1]">
        <h5 className="text-2xl font-bold tracking-tight text-gray-500">
                You are invited!
        </h5>

        <p className="font-normal text-gray-700">
            [Trip Name]
        </p>
        <p className="font-normal text-gray-700">
            Invited by [Name]
        </p>
        <div className="flex gap-4">
        <p className="font-normal text-gray-700  ">
         [Destination]
        </p>
        <p className="font-normal text-gray-700 ">
            [Trip Dates]
        </p>
        </div>
    </Card>


    <Card href="#" className=" mt-8 mx-auto max-w-md hover:bg-[#FFF0F1]">
        <form className="flex max-w-md flex-col gap-4">
            <div>
                <div className="mb-2 block">
                    <h5 className="text-2xl font-bold tracking-tight text-gray-500">Create an account to
                    accept your invitation and join the [Title Name]</h5>
                </div>

                <div className="flex gap-3 mb-2 block">

                    <Button className= "w-1/2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-1.5 px-3 rounded-lg transition-colors" type="submit">Sign Up</Button>

                    <Button className= "w-1/2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-1.5 px-3 rounded-lg transition-colors">Log In</Button>



                </div>



                <p className="font-normal text-gray-700 ">
                    Full Name *
                </p>
                <TextInput id="email2" type="email" placeholder="[Your Name]" required shadow />

                <p className="font-normal text-gray-700 ">
                    Email Address *
                </p>
                <TextInput id="email2" type="email" placeholder="[name@flowbite.com]" required shadow />

                <p className="font-normal text-gray-700 ">
                    Password *
                </p>
                <TextInput id="email2" type="email" placeholder="[Create Password]" required shadow />


            </div>
            <Button className= "bg-[#FD6B6C] hover:bg-red-600" type="submit">Sign Up and Accept Invitation</Button>

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
}