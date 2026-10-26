import {createTheme, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow} from "flowbite-react";
import { Card } from "flowbite-react";
import {TravelerRow} from "~/routes/travel-itinerary/traveler-row";
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
        children: 0,
        adults: 0,
    },
    {userId: 'qerwerwerewrw',
        tripId: 'adfsfdsfds',
        name: 'Memaw',
        phone: '867-5444',
        email: '2email@email.com',
        going: 'yes',
        children: 4,
        adults: 1,
    }

]
    return (
        <main className="min-h-screen bg-[#FEA6A7]">
            <h1 className={'text-3xl font-bold'}>Travelers & Invites</h1>
            <p> Need link from My Trips "Name Trip"</p>
            <h1 className={'font-bold'}> Traveler Roster</h1>

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


            <h1 className={'font-bold'}> Chilren & Parent Attendance</h1>
            <p> Parent/guardian card goes here</p>
            <section className={''}>

                <Card href="#" className="max-w-sm">
                    <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Noteworthy technology acquisitions 2021
                    </h5>
                    <p className="font-normal text-gray-700 dark:text-gray-400">
                    Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.
                    </p>
                </Card>




            </section>

            <h1> Invite adult travelers</h1>
            <p> Invite adult travelers card goes here</p>
            <p> will need a button inside card "send invitations"</p>


        </main>
    )
}