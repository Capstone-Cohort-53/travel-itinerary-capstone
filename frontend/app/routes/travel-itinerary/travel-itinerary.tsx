import {createTheme, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow} from "flowbite-react";

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

export default function TravelItinerary() {

    return (
        <main className="min-h-screen bg-[#FEA6A7]">
            <h1 className={'text-3xl font-bold'}>Travelers & Invites</h1>
            <p> Need link from My Trips "Name Trip"</p>
            <h1> Traveler roster</h1>

            <p> Traveler/Email Table goes here - a table</p>
            <section className={''}>
                <div className="overflow-x-auto rounded-xl">
                <Table striped theme={coralTableTheme.table}>
                    <TableHead>
                        <TableHeadCell>Traveler</TableHeadCell>
                        <TableHeadCell> Email </TableHeadCell>
                        <TableHeadCell>Status</TableHeadCell>
                        <TableHeadCell>Role</TableHeadCell>
                        <TableHeadCell>Children</TableHeadCell>
                    </TableHead>

                    <TableBody>
                        <TableRow>
                            <TableCell>Maya Rodriguez</TableCell>
                            <TableCell>maya@gmail.com</TableCell>
                            <TableCell>Going</TableCell>
                            <TableCell>Organizer</TableCell>
                            <TableCell>2</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>


            </section>


            <h1> Chilren & Parent Attendance</h1>
            <p> Parent/guardian card goes here</p>

            <h1> Invite adult travelers</h1>
            <p> Invite adult travelers card goes here</p>
            <p> will need a button inside card "send invitations"</p>


        </main>
    )
}