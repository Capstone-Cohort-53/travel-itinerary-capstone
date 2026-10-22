import {Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow} from "flowbite-react";

export default function TravelItinerary() {

    return (
        <>
            <h1 className={'text-3xl font-bold'}>Travelers & Invites</h1>
            <p> Need link from My Trips "Name Trip"</p>
            <h1> Traveler roster</h1>

            <p> Traveler/Email Table goes here - a table</p>
            <section className={'border rounded'}>
            <div className="overflow-x-auto">
                <Table className={ "bg-[#FD6B6C]"}>
                    <TableHead>
                        <TableHeadCell>Traveler</TableHeadCell>
                        <TableHeadCell>Email</TableHeadCell>
                        <TableHeadCell>Status</TableHeadCell>
                        <TableHeadCell>Role</TableHeadCell>
                        <TableHeadCell>Children</TableHeadCell>

                    </TableHead>
                    <TableBody className="divide-y whitespace-nowrap font-medium text-white">
                        <TableRow className=" bg-[#FD6B6C]  ">
                            <TableCell>
                                Maya
                            </TableCell>
                            <TableCell >Going</TableCell>
                            <TableCell>Organizer</TableCell>
                            <TableCell>No</TableCell>

                        </TableRow>
                        <TableRow className="  bg-[#FD6B6C]">
                            <TableCell className="whitespace-nowrap font-medium text-white ">
                                Maya
                            </TableCell>
                            <TableCell>Going</TableCell>
                            <TableCell>Organizer</TableCell>
                            <TableCell>No</TableCell>

                        </TableRow>
                        <TableRow className="bg-[#FD6B6C]">
                            <TableCell className="whitespace-nowrap font-medium text-white ">
                                Maya
                            </TableCell>
                            <TableCell>Going</TableCell>
                            <TableCell>Organizer</TableCell>
                            <TableCell>No</TableCell>

                        </TableRow>
                        <TableRow className=" bg-[#FD6B6C]">
                            <TableCell className="whitespace-nowrap font-medium text-white ">
                                Maya
                            </TableCell>
                            <TableCell>Going</TableCell>
                            <TableCell>Organizer</TableCell>
                            <TableCell>No</TableCell>

                        </TableRow>
                        <TableRow className=" bg-[#FD6B6C]">
                            <TableCell className="whitespace-nowrap font-medium text-white ">
                                Maya
                            </TableCell>
                            <TableCell>Going</TableCell>
                            <TableCell>Organizer</TableCell>
                            <TableCell>No</TableCell>

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


        </>
    )
}