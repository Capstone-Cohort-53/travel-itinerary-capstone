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


export type Traveler =  {userId: string,
    tripId: string,
    name: string,
    phone: string,
    email: string,
    going: string,
    children: number,
    adults: number,
}



export default function TravelItinerary() {
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
        <main className="min-h-screen">
            <h1 className={'text-2xl font-bold tracking-tight text-gray-500'}>Travelers & Invites</h1>
                    <p> Need link from My Trips "Name Trip"</p>
            <h1 className={'text-2xl font-bold tracking-tight text-gray-500'}> Traveler Roster</h1>

            <section className={''}>
                <div className="overflow-x-auto rounded-xl">
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


            <section className={'overflow-x-auto rounded-xl my-8'}>

                <Card href="#" className="max-w-sm">
                    <h5 className="text-2xl font-bold tracking-tight text-gray-500">
                        Status:
                    </h5>
                    <p className="font-normal text-gray-700 dark:text-gray-400">
                        Going: {totalGoing}
                    </p>

                    <p className="font-normal text-gray-700 dark:text-gray-400">
                        Not Going: {totalNotGoing}
                    </p>
                    <p className="font-normal text-gray-700 dark:text-gray-400">
                        Maybe: {totalMaybe}
                    </p>
                </Card>
            </section>

            <section className={'overflow-x-auto rounded-xl my-8'}>

                <Card href="#" className="max-w-sm">
                    <h5 className="text-2xl font-bold tracking-tight text-gray-500">
                        Total Attendance:  {totalTravelers}
                    </h5>
                    <p className="font-normal text-gray-700 dark:text-gray-400">
                    Adult Count: {totalAdults}
                    </p>

                    <p className="font-normal text-gray-700 dark:text-gray-400">
                        Children Count: {totalChildren}
                    </p>
                </Card>
            </section>


            <section>
                <form className="flex max-w-md flex-col gap-4">
                    <div>
                        <div className="mb-2 block">
                            <h5 className="text-2xl font-bold tracking-tight text-gray-500">Invite Adult Travelers</h5>
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
                    <Button type="submit">Send Invitations</Button>
                </form>



            </section>


        </main>
    )
}