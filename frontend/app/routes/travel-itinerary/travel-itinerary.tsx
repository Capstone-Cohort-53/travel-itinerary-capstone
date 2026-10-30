import {createTheme, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow} from "flowbite-react";
import { Card } from "flowbite-react";
import {TravelerRow} from "~/routes/travel-itinerary/traveler-row";
import { Button, Checkbox, Label, TextInput } from "flowbite-react";

const coralTableTheme = createTheme({
    table: {
        head: {
            base: "text-sm text-white",
            cell: {
                base: "bg-[#FD6B6C] px-6 py-3 text-white"
            }
        },
        row: {
            striped: "odd:bg-white even:bg-[#FFF0F1]"
        }
    }
});


//note: travelers is a join of "Users" and "Travelers"
export type Traveler =  {
    userId: string,
    tripId: string,
    name: string,
    phone: string,
    email: string,
    going: string,
    children: number,
    adults: number,
}



export default function TravelItinerary() {
    //note: travelers is a join of "Users" and "Travelers"
const travelers: Traveler[] = [
    {userId: 'ljsljfsljfsldkjfldkjflsdkj',
    tripId: 'ljlkkjlkjlkj',
    name: 'Jerry',
    phone: '867-5309',
    email: 'email@email.com',
    going: 'yes',
        children: 5,
        adults: 3,
    },
    {userId: 'iuiuyiuyiuyiouioiopp3',
        tripId: 'kjiuiyiuoiuiu3',
        name: 'Timmy',
        phone: '867-5308',
        email: '1email@email.com',
        going: 'no',
        children: 1,
        adults: 1,
    },
    {userId: 'qerwerwerewrw',
        tripId: 'adfsfdsfds',
        name: 'Memaw',
        phone: '867-5444',
        email: '2email@email.com',
        going: 'yes',
        children: 4,
        adults: 1,
    }]
    //filter for Total Travelers
//sum total travelers
    const totalTravelers=travelers.reduce ((accumulator, traveler) => accumulator + (traveler.going==='yes' ? (traveler.children+traveler.adults) : 0), 0)
//sum of adults
    const totalAdults=travelers.reduce ((accumulator, traveler) => accumulator + (traveler.adults), 0)
    // sum of children
    const totalChildren=travelers.reduce ((accumulator, traveler) => accumulator + (traveler.children), 0)
// filter for people going-notgoing-maybe
    const totalGoing=travelers.filter(( traveler) => traveler.going ==='yes').length
    const totalNotGoing=travelers.filter(( traveler) => traveler.going ==='no').length
    const totalMaybe=travelers.filter(( traveler) => traveler.going ==='maybe').length

    return (

        <div className="bg-[url('/bg_reduced.jpeg')] bg-cover bg-left bg-no-repeat">

        <main className="min-h-screen container mx-auto max-w-3xl">
            <h1 className={'text-2xl font-bold tracking-tight text-gray-500'}>Travelers & Invites</h1>

            <h2 className={'text-lg text-center font-bold tracking-tight text-gray-600'}> Title of the Trip from Page 4</h2>


            <h1 className={'text-2xl font-bold tracking-tight text-gray-500 mt-12'}> Traveler Roster</h1>

            <section className={''}>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                <Table striped theme={coralTableTheme.table}>
                    <TableHead>
                        <TableHeadCell>Traveler Name</TableHeadCell>
                        <TableHeadCell>Phone Number</TableHeadCell>
                        <TableHeadCell> Email </TableHeadCell>
                        <TableHeadCell>Status</TableHeadCell>
                        <TableHeadCell>Adults</TableHeadCell>
                        <TableHeadCell>Children</TableHeadCell>
                    </TableHead>

                    <TableBody>
                        {travelers.map((traveler:Traveler) => <TravelerRow traveler={traveler}/>)}

                    </TableBody>
                </Table>
            </div>


            </section>


            <section className={'gap-6 overflow-x-auto flex rounded-xl my-8'}>

                <Card href="#" className="w-sm hover:bg-[#FFF0F1]">
                    <h5 className="text-2xl font-bold tracking-tight text-gray-500">
                        Status 📊:
                    </h5>
                    <p className="font-normal text-gray-700 dark:text-gray-400">
                        🟢 Going: {totalGoing}
                    </p>


                    <p className="font-normal text-gray-700 dark:text-gray-400">
                        🔴 Not Going: {totalNotGoing}
                    </p>
                    <p className="font-normal text-gray-700 dark:text-gray-400">
                        ⚪ Maybe: {totalMaybe}
                    </p>
                </Card>

                <Card href="#" className="w-sm hover:bg-[#FFF0F1]">
                    <h5 className="text-2xl font-bold tracking-tight text-gray-500">
                        Total Attendance 👥:  {totalTravelers}
                    </h5>

                    <p className="font-normal text-gray-700 dark:text-gray-400">
                        Traveler Names:  {travelers.map((traveler:Traveler) =>  traveler.name).join(', ')}
                    </p>

                    <p className="font-normal text-gray-700 dark:text-gray-400">
                        Adult Count: {totalAdults}

                    </p>

                    <p className="font-normal text-gray-700 dark:text-gray-400">
                        Children Count: {totalChildren}
                    </p>


                </Card>

            </section>



            <section>
                <Card href="#" className="hover:bg-[#FFF0F1]">
                <form className="flex max-w-md flex-col gap-4">
                    <div>
                        <div className="mb-2 block">
                            <h5 className="text-2xl font-bold tracking-tight text-gray-500">Invite More Adult Travelers</h5>
                        </div>

                        <p className="font-normal text-gray-700 dark:text-gray-400">
                            Email
                        </p>
                        <TextInput id="email2" type="email" placeholder="[name@flowbite.com]" required shadow />
                        <p className="font-normal text-gray-700 dark:text-gray-400">
                            Invitation Message
                        </p>
                        <TextInput id="email2" type="text" placeholder="[Message for your guest]" required shadow />

                        <p className="font-normal text-gray-700 dark:text-gray-400">
                           +Add Another Email
                        </p>

                    </div>
                    <Button className= "bg-[#FD6B6C] hover:bg-red-600" type="submit">Send Invitations</Button>
                </form>
                </Card>


            </section>


        </main>
        </div>
    )
}
// Might want to incorporate for final submission:
//Breadcrumbs or a "Back" Button: Since this is a specific trip's roster, a simple link at the very top left (like ← Back to Dashboard or Trips / Summer Vacation / Invites) helps users orient themselves.
//
// Table Action Buttons: Your Traveler Roster displays data, but there is no way to manage it. Adding an "Actions" column with Edit (✏️) and Delete (🗑️) icons would allow users to update RSVPs or remove guests.
//
// Manual "Add Guest" Option: You have a form to send email invitations, but you may want a button to manually add a traveler to the roster (e.g., for children or guests without email).
//
// Success Notifications (Toasts): When a user clicks "Send Invitations," there is currently no placeholder for a success message. Adding a temporary pop-up (toast) confirming the emails were sent provides necessary user feedback.