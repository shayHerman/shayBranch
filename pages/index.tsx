import Head from "next/head";
import { useSession, signIn, signOut } from "next-auth/react";
import styles from "@/styles/Home.module.css";
import { Notion } from "@/lib/notion";
import {
  Button,
  Collapse,
  Divider,
  Grid,
  Select,
  Spacer,
  Spinner,
  Text,
  Toggle,
  Checkbox
} from "@geist-ui/core";
import { useEffect, useState } from "react";
import {
  TShift,
  TUser,
  UserType,
  getPageIcon,
  getPageTitle,
  identifyShift,
  toDate,
  toTime,
  Positions,
  positonsTypes
} from "@/lib/utils";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { Participents } from "@/components/Participants";
import { ShiftCard } from "@/components/ShiftCard";
import { AvailabilityCard } from "@/components/AvailabilityCard";
import { Eye } from "@geist-ui/icons";
import { ShiftActions } from "@/components/ShiftActions";

const PADDING = "0 12px";

export default function Home(props: { users: Array<any> }) {
  const [userId, setUserId] = useState<string>("");
  const [user, setUser] = useState<TUser | null>();
  const [shifts, setShifts] = useState<Array<any>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [allUsers, setAllUsers] = useState<Array<any>>(props.users);

  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    if (userId) {
      setLoading(true);
      fetch(`/api/shifts?uid=${userId}`)
        .then((res) => res.json())
        .then((data) => {
          localStorage.setItem("salit-uid", userId);
          setShifts(data.shifts);
          setUser(allUsers.find((user) => user.id === userId));
          setLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    const uid = localStorage.getItem("salit-uid");
    if (uid) {
      setUserId(uid);
      setUser(allUsers.find((user) => user.id === userId));
    } else {
      onClear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allUsers]);

  const onClear = () => {
    setUserId("");
    setLoading(true);
    fetch(`/api/shifts`)
      .then((res) => res.json())
      .then((data) => {
        setShifts(data.shifts);
        setLoading(false);
      });
    setUser(undefined);
  };

  const Shifts = (props: { shifts: Array<PageObjectResponse> }) => {
    const [filterdShifts, setFilterdShifts ] = useState(Object.values(positonsTypes));
    if (props.shifts.length === 0) {
      return <NoShifts />;
    }
    return (
       <Collapse.Group>
            {userId && <Collapse title="סינון" >
              <Checkbox.Group value={Object.values(positonsTypes)}  onChange={(ev: any) => setFilterdShifts(ev)} style={{direction: "ltr"}}>
                <Checkbox value = {positonsTypes.PATROL} > {Positions.PATROL} </Checkbox>
                <Checkbox value = {positonsTypes.GATE} > {Positions.GATE} </Checkbox>
                <Checkbox value = {positonsTypes.FLOWERS} > {Positions.FLOWERS} </Checkbox>
                <Checkbox value = {positonsTypes.DRONE} > {Positions.DRONE} </Checkbox>
                <Checkbox value = {positonsTypes.ONCALL} > {Positions.ONCALL} </Checkbox>
                <Checkbox value = {positonsTypes.EVENT} > {Positions.EVENT} </Checkbox>
              </Checkbox.Group>
            </Collapse>}
        {props.shifts &&
          props.shifts
            .slice(1)
            .map((shift) => (
              <Shift
                key={shift.id}
                shift={shift}
                type={identifyShift(shift, userId)}
              />
            ))
            .filter((Shift)=>(
              filterdShifts.includes(Shift.props.type.type)))}
      </Collapse.Group>
    );
  };

  const Shift = (props: { shift: PageObjectResponse; type: TShift }) => {
    const time =
      props.shift.properties["זמן"].type == "date" &&
      props.shift.properties["זמן"].date;
    const isAnonymus = props.type.type === "unknown";

    if (!time) {
      return null;
    }

    const subtitle = `${toDate(time.start)} @ ${toTime(
      time.end as string
    )} - ${toTime(time.start)}`;

    let title: string;
    if (props.type.type === "event") {
      title = `${getPageIcon(props.shift, props.type.emoji)} ${getPageTitle(
        props.shift
      )}`;
    } else if (isAnonymus) {
      title = subtitle;
    } else {
      title = `${props.type.emoji} ${props.type.name}`;
    }

    const calData = {
      title,
      startDate: new Date(time.start),
      endDate: new Date(time.end as string),
    };

    return (
      <Collapse
        title={title}
        subtitle={props.type.type !== "unknown" && subtitle}
      >
        <Participents shift={props.shift} allUsers={allUsers} />
        {isAnonymus ? null : (
          <>
            <Divider my={2} />
            <ShiftActions calData={calData} />
          </>
        )}
      </Collapse>
    );
  };

  const SearchRow = () => {
    return (
      <Grid.Container gap={1} justify="center" style={{ padding: PADDING }}>
        <Grid xs={20}>
          <Select
            placeholder="שם"
            onChange={(e) => setUserId(e as string)}
            height="50px"
            width="100%"
            value={userId}
          >
            {props.users.map((user) => (
              <Select.Option key={user.id} value={user.id} font={2}>
                {user.username}
              </Select.Option>
            ))}
          </Select>
        </Grid>
        <Grid xs={4}>
          <Button
            iconRight={<Eye />}
            height="50px"
            width="50px"
            padding={0}
            onClick={onClear}
            disabled={!userId}
          />
        </Grid>
      </Grid.Container>
    );
  };

  if (sessionStatus === "unauthenticated") {
    return <Unauthorized />;
  }

  return (
    <>
      <Head>
        <title>סלעית | רשימת שמירה</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className={`${styles.main}`}>
        <Grid.Container
          justify="center"
          direction="column"
          alignItems="center"
          style={{ padding: "24px 12px", gap: "20px" }}
        >
          <Grid>
            <Text h1>רשימת שמירה</Text>
          </Grid>
          <SearchRow />
          {loading ? (
            <Grid>
              <Loader />
            </Grid>
          ) : (
            <>
              {user === undefined || user?.type === UserType.BAR ? null : (
                <Grid className={`${styles.grid}`} style={{ padding: PADDING }}>
                  <AvailabilityCard userId={userId} />
                </Grid>
              )}
              {shifts.length > 0 && (
                <Grid className={`${styles.grid}`} style={{ padding: PADDING }}>
                  <ShiftCard
                    shift={shifts[0]}
                    userId={userId}
                    allUsers={allUsers}
                  />
                </Grid>
              )}
              <Grid className={`${styles.grid}`}>
                <Shifts shifts={shifts} />
              </Grid>
              <Grid>
                <Button
                  type="secondary"
                  scale={1.5}
                  onClick={() => signOut()}
                  width="100%"
                >
                  <Text b>Logout</Text>
                </Button>
              </Grid>
            </>
          )}
        </Grid.Container>
      </main>
    </>
  );
}

const Loader = () => {
  return (
    <>
      <Spacer h={2} />
      <Spinner scale={5} />
    </>
  );
};

const NoShifts = () => {
  return (
    <Grid.Container direction="column" alignContent="center">
      <Text h1 style={{ textAlign: "center" }}>
        🏝️
      </Text>
      <Text h3>אין משמרות</Text>
    </Grid.Container>
  );
};

const Unauthorized = () => {
  return (
    <Grid.Container
      gap={2}
      alignItems="center"
      direction="column"
      height="100vh"
      style={{ paddingBlockStart: "24px" }}
    >
      <Grid>
        <Text h1 className={`${styles.textCenter}`}>
          רשימת שמירה
        </Text>
      </Grid>
      <Grid>
        <Text
          h2
          className={`${styles.textCenter}`}
          style={{ fontSize: "80px" }}
        >
          🤐
        </Text>
      </Grid>
      <Grid>
        <Text h3 className={`${styles.textCenter}`}>
          כניסה לא מאושרת
        </Text>
      </Grid>
      <Grid>
        <Button
          type="secondary"
          scale={1.5}
          onClick={() => signIn()}
          width="100%"
        >
          <Text b>כניסה</Text>
        </Button>
      </Grid>
    </Grid.Container>
  );
};

export const getStaticProps = async () => {
  const allUsers = await new Notion().getAllUsers();
  return {
    props: {
      users: allUsers,
    },
  };
};
