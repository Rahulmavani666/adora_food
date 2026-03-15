import { NextResponse } from "next/server";

function notConfiguredResponse() {
	return NextResponse.json(
		{
			error:
				"NextAuth is not configured. This project currently uses Firebase Auth flows.",
		},
		{ status: 501 }
	);
}

export async function GET() {
	return notConfiguredResponse();
}

export async function POST() {
	return notConfiguredResponse();
}
