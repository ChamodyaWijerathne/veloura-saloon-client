import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUser, isPrivileged } from "@/utils/authentication";

export async function GET(request: NextRequest) {

    const havePrivilege = await isPrivileged(request, "users:read");

    if(!havePrivilege){
        return NextResponse.json(
            {
                message: "You do not have the required privileges to access this resource."
            }, { status: 403 }
        )
    }


        const users = await prisma.user.findMany({
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
        return NextResponse.json(
            {
                message: "Users fetched successfully",
                users: users
            }, { status: 200 }
        );
    
}
        
    
    
    
