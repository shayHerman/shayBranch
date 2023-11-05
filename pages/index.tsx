import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { Notion } from "@/lib/notion";
import { Select, Text } from "@geist-ui/core";
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function Home(props: { users: Array<any> }) {
  const [userId, setUserId] = useState<string>("");
  const handler = (e) => {
    console.log(e);
  };
  return (
    <>
      <Head>
        <title>Salit</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <Text h1>Home Page</Text>
        <Select placeholder="Choose one" onChange={(e) => setUserId(e)}>
          {props.users.map((user) => (
            <Select.Option key={user.id} value={user.id}>
              {user.username}
            </Select.Option>
          ))}
        </Select>
        <Text h2>Shifts for {userId}</Text>
      </main>
    </>
  );
}

export const getServerSideProps = async () => {
  const allUsers = await new Notion().getAllUsers();
  return {
    props: {
      users: allUsers,
    },
  };
};
