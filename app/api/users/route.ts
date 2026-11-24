import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUser, isPrivileged } from "@/utils/authentication";
import bcrypt from "bcryptjs";


export async function GET(request: NextRequest) {

    const havePrivilege = await isPrivileged(request, "users:read");

    if(!havePrivilege){
        return NextResponse.json(
            {
                message: "You do not have the required privileges to access this resource."
            }, { status: 403 }
        )
    }

    const pageNumberInString = request.nextUrl.searchParams.get("pageNumber") || "1";
    const pageSizeInString = request.nextUrl.searchParams.get("pageSize") || "10";
    const pageNumber =parseInt(pageNumberInString);
    const pageSize = parseInt(pageSizeInString);

    const userCount = await prisma.user.count();

    const totalPages = Math.ceil(userCount / pageSize);

    if(pageNumber > totalPages){
        return NextResponse.json(
            {
                message: "Page number exceeds total pages",
                totalPages: totalPages
            }, { status: 400 }
        )
    }

    const users = await prisma.user.findMany({
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        select:{
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            status: true,
            lastLogin: true,
            phone: true,
            password: false,
            createdAt: true,
            privileges: true
        }
    })

        // const users = await prisma.user.findMany({
        //     select:{
        //         id: true,
        //         firstName: true,
        //         lastName: true,
        //         email: true,
        //         role: true,
        //         status: true,
        //         lastLogin: true,
        //         phone: true,
        //         password: false,
        //         createdAt: true,
        //         privileges: true

        //     }
        // })
        return NextResponse.json(
            {
                message: "Users fetched successfully",
                users: users,
                pagination: {
                    pageNumber: pageNumber,
                    pageSize: pageSize,
                    totalPages: totalPages,
                    totalUsers: userCount
                }
            }, { status: 200 }
        );
    
}
        
export async function POST(request: NextRequest) {

    const body = await request.json();

    if(body.email == null){
        return NextResponse.json(
            {
                message: "Email is required"
            }, { status: 400 }
        )
    }

    if(body.firstName == null){
        return NextResponse.json(
            {
                message: "First name is required"
            }, { status: 400 }
        )
    }

    if(body.lastName == null){
        return NextResponse.json(
            {
                message: "Last name is required"
            }, { status: 400 }
        )
    }

    if(body.password == null){
        return NextResponse.json(
            {
                message: "Password is required"
            }, { status: 400 }
        )
    }

    const existingUser = await prisma.user.findUnique(
        {
            where: {
                email: body.email
            }
        }
    )

    if(existingUser != null){
        return NextResponse.json(
            {
                message: "A user with this email already exists"
            }, { status: 409 }
        )
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    await prisma.user.create({
        data:{
            email: body.email,
            firstName: body.firstName,
            lastName: body.lastName,
            password: passwordHash,
            phone: body.phone,
        }
    })

    return NextResponse.json(
        {
            message: "User created successfully"
        }, { status: 201 }
    )

} 

export async function PUT(request: NextRequest) {
    const id = request.nextUrl.searchParams.get("id");

    const requestedUser = await getUser(request);

    if(requestedUser == null){
        return NextResponse.json(
            {
                message: "You are not logged in. Please log in to access this resource."
            }, { status: 401 }
        )
    }

    const body = await request.json();

    if(requestedUser.id == id){
        const user = await prisma.user.findUnique({
            where:{
                id: id
            }
        })
        
        if(user == null){
            return NextResponse.json(
                {
                    message: "User not found"
                }, { status: 404 }
            )
        }

        await prisma.user.update({
            where:{
                id: id
            },
            data:{
                email: body.email || user.email,
                firstName: body.firstName || user.firstName,
                lastName: body.lastName || user.lastName,
                phone: body.phone || user.phone,
                profileImage: body.profileImage || user.profileImage,

            }
        })
        return NextResponse.json(
            {
                message: "User updated successfully"
            }, { status: 200 }
        )
    }else{

        const havePrivilege = await isPrivileged(request, "users:edit");

        if(!havePrivilege){
            return NextResponse.json({
                message: "You do not have the privillage to edit other users"
            },{
                status:403
                }
            )
        }

        const user = await prisma.user.findUnique({
            where:{
                id:id || "<USER_ID>"
            }
        })

        if(user == null){
            return NextResponse.json({
                message: "User not found"
            }, {
                status: 404
            })
        }

        await prisma.user.update({
            where:{
                id: id || "<USER_ID>"
            },
            data:{
                email: body.email || user.email,
                firstName: body.firstName || user.firstName,
                lastName: body.lastName || user.lastName,
                phone: body.phone || user.phone,
                profileImage: body.profileImage || user.profileImage,
                role: body.role || user.role,
                status: body.status || user.status,
                privileges: body.privileges || user.privileges
            }
        })

        return NextResponse.json({
            message: "User updated successfully"
        }, { status: 200 }
        )



        //user is trying to update someone else's profile
    }
}
    
