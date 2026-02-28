// import NextAuth from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import GoogleProvider from "next-auth/providers/google";
// import GitHubProvider from "next-auth/providers/github";

// const handler = NextAuth({
//   providers: [
//     // ✅ Google Login
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//     }),

//     // ✅ GitHub Login
//     GitHubProvider({
//       clientId: process.env.GITHUB_CLIENT_ID!,
//       clientSecret: process.env.GITHUB_CLIENT_SECRET!,
//     }),

//     // ✅ Custom Sign Up/Login
//     CredentialsProvider({
//       name: "Credentials",
//       credentials: {
//         email: { label: "Email", type: "text" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         // Here you check credentials with your DB
//         const user = await fakeDB.findUser(credentials?.email, credentials?.password);
//     //   const user={
//     //     id:22,
//     //     name:"rahul",
//     //     email:"r@gmail.com"

//     //     }

//         if (user) {
//           return { id: user.id, name: user.name, email: user.email };
//         }
//         return null;
//       },
//     }),
//   ],

//   session: { strategy: "jwt" },
//   secret: process.env.NEXTAUTH_SECRET,
// });

// export { handler as GET, handler as POST };
