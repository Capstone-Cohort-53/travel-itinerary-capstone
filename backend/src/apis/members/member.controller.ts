import {type Request, response, type Response} from 'express'
import {selectMemberById} from "./member.model.ts"
import {sendError, sendServerError} from "../../utils/response.utils.ts"
import {request} from "node:http";

export async function selectMemberById(memberId: string): Promise<Member | null> {
    try {
        const memberId = request.session?.memberId

        if (sessionProfile === undefined || sessionProfile === null) {
            sendError(request, response, 401, 'You must be signed in to view your profile')
            return
        }
        const data = await selectMemberById(memberId)
        if (memberId === null) {
            sendError(request, response, 404, 'Profile not found')
            return
        }


        response.status(200).json(memberId)
    } catch (error: any) {
         console.error(error)
         sendServerError(request, response)
     }




    }
    return {
        memberId,
        email: 'user@example.com',
        firstName: 'Alex',
        lastName: 'Rivera',
        createdAt: new Date(),
    };
}


















// export async function getMemberById (request: Request, response: Response): Promise<void> {
//     try {
//         const memberId = request.session?.memberId
//
//         if (sessionProfile === undefined || sessionProfile === null) {
//             sendError(request, response, 401, 'You must be signed in to view your profile')
//             return
//         }
//         const data = await selectMemberById(memberId)
//         if (memberId === null) {
//             sendError(request, response, 404, 'Profile not found')
//             return
//         }
//
//
//         response.status(200).json(memberId)
//     } catch (error: any) {
//         console.error(error)
//         sendServerError(request, response)
//     }
// }