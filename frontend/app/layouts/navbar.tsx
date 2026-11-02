import {Button, Navbar, NavbarBrand, NavbarCollapse, NavbarLink, NavbarToggle} from "flowbite-react";
import { Outlet } from "react-router";
import {FooterCap} from "~/layouts/footer";

export default function Nav () {
    return <>

        <Navbar fluid rounded>
            <NavbarBrand href="https://flowbite-react.com">
                <img src="/favicon.svg" className="mr-3 h-6 sm:h-9" alt="Flowbite React Logo" />
                <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">[Company Name]</span>
            </NavbarBrand>
            <div className="flex md:order-2">
                <Button>Log in with Google</Button>
                <NavbarToggle />
            </div>
            <NavbarCollapse>
                {/*<NavbarLink href="#" active>*/}
                {/*    Home*/}
                {/*</NavbarLink>*/}
                <NavbarLink href="#">My Trips</NavbarLink>
                <NavbarLink href="#">Manage Travelers</NavbarLink>
            </NavbarCollapse>
        </Navbar>
<Outlet/>
        <FooterCap/>
    </>
}