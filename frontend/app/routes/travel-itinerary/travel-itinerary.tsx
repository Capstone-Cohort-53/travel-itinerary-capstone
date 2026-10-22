import {Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow} from "flowbite-react";

export default function TravelItinerary() {

    return (
        <main className="min-h-screen bg-[#FEA6A7]">
            <h1 className={'text-3xl font-bold'}>Travelers & Invites</h1>
            <p> Need link from My Trips "Name Trip"</p>
            <h1> Traveler roster</h1>

            <p> Traveler/Email Table goes here - a table</p>
            <section className={'border rounded'}>
                <div className="overflow-x-auto">
                    <Table striped>
                        <TableHead>
                            <TableHeadCell>Product name</TableHeadCell>
                            <TableHeadCell>Color</TableHeadCell>
                            <TableHeadCell>Category</TableHeadCell>
                            <TableHeadCell>Price</TableHeadCell>
                            <TableHeadCell>
                                <span className="sr-only">Edit</span>
                            </TableHeadCell>
                        </TableHead>
                        <TableBody className="divide-y">
                            <TableRow className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                    Apple MacBook Pro 17"
                                </TableCell>
                                <TableCell>Sliver</TableCell>
                                <TableCell>Laptop</TableCell>
                                <TableCell>$2999</TableCell>
                                <TableCell>
                                    <a href="#" className="font-medium text-primary-600 hover:underline dark:text-primary-500">
                                        Edit
                                    </a>
                                </TableCell>
                            </TableRow>
                            <TableRow className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                    Microsoft Surface Pro
                                </TableCell>
                                <TableCell>White</TableCell>
                                <TableCell>Laptop PC</TableCell>
                                <TableCell>$1999</TableCell>
                                <TableCell>
                                    <a href="#" className="font-medium text-primary-600 hover:underline dark:text-primary-500">
                                        Edit
                                    </a>
                                </TableCell>
                            </TableRow>
                            <TableRow className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">Magic Mouse 2</TableCell>
                                <TableCell>Black</TableCell>
                                <TableCell>Accessories</TableCell>
                                <TableCell>$99</TableCell>
                                <TableCell>
                                    <a href="#" className="font-medium text-primary-600 hover:underline dark:text-primary-500">
                                        Edit
                                    </a>
                                </TableCell>
                            </TableRow>
                            <TableRow className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                    Google Pixel Phone
                                </TableCell>
                                <TableCell>Gray</TableCell>
                                <TableCell>Phone</TableCell>
                                <TableCell>$799</TableCell>
                                <TableCell>
                                    <a href="#" className="font-medium text-primary-600 hover:underline dark:text-primary-500">
                                        Edit
                                    </a>
                                </TableCell>
                            </TableRow>
                            <TableRow className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">Apple Watch 5</TableCell>
                                <TableCell>Red</TableCell>
                                <TableCell>Wearables</TableCell>
                                <TableCell>$999</TableCell>
                                <TableCell>
                                    <a href="#" className="font-medium text-primary-600 hover:underline dark:text-primary-500">
                                        Edit
                                    </a>
                                </TableCell>
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