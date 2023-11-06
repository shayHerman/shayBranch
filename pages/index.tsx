import Head from "next/head";
import styles from "@/styles/Home.module.css";
import { Notion } from "@/lib/notion";
import { Collapse, Divider, Select, Text } from "@geist-ui/core";
import { useEffect, useState } from "react";
import {
  TShift,
  identifyShift,
  toDate,
  toRelativeTime,
  toTime,
} from "@/lib/utils";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export default function Home(props: { users: Array<any> }) {
  const [userId, setUserId] = useState<string>("");
  const [shifts, setShifts] = useState<Array<any>>([]);

  useEffect(() => {
    if (userId) {
      fetch(`/api/shifts?uid=${userId}`)
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          setShifts(data.shifts);
        });
    } else {
      setShifts([]);
    }
  }, [userId]);

  return (
    <>
      <Head>
        <title>Salit</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main}`}>
        <Text h1>רשימת שמירה</Text>
        <Select
          placeholder="Choose one"
          onChange={(e) => setUserId(e as string)}
        >
          {props.users.map((user) => (
            <Select.Option key={user.id} value={user.id}>
              {user.username}
            </Select.Option>
          ))}
        </Select>
        <Divider h={5} />
        <Collapse.Group className={styles.shiftsContainer}>
          {shifts &&
            shifts.map((shift) => (
              <Shift
                key={shift.id}
                shift={shift}
                type={identifyShift(shift, userId)}
              />
            ))}
        </Collapse.Group>
      </main>
    </>
  );
}

const Shift = (props: { shift: PageObjectResponse; type: TShift }) => {
  const time =
    props.shift.properties["זמן"].type == "date" &&
    props.shift.properties["זמן"].date;
  const subtitle =
    time &&
    `${toDate(time.start)} @ ${toTime(time.end as string)} - ${toTime(
      time.start
    )} (${toRelativeTime(time.start)})`;
  const title = `${props.type.emoji} ${props.type.name}`;
  return (
    <Collapse title={title} subtitle={subtitle}>
      <Text>{props.type.name}</Text>
    </Collapse>
  );
};

export const getServerSideProps = async () => {
  const allUsers = await new Notion().getAllUsers();
  return {
    props: {
      users: allUsers,
    },
  };
};
