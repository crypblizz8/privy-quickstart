import { PrivyClient, SiweSession } from "@privy-io/privy-browser";
import { useEffect, useState } from "react";
import Head from "next/head";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

// Initialize the Privy client.
const provider = typeof window !== "undefined" ? window.ethereum : null;
const session = new SiweSession(
  process.env.NEXT_PUBLIC_PRIVY_API_KEY,
  provider
);
const client = new PrivyClient({
  session: session,
});

export default function Home() {
  // Use WAGMI provider for logging in and getting the eth Address.
  const { address, isDisconnected } = useAccount();

  // Use React's useState hook to keep track of the signed in Ethereum address
  const [firstName, setFirstName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [favoriteColor, setFavoriteColor] = useState("");

  // React States for authentication status + if data has been pushed to Privy.
  const [authenticatedwithPrivy, setAuthenticatedwithPrivy] = useState(false);
  const [savedData, setSavedData] = useState(false);

  // Get the user data from Privy whenever the wallet address is set.
  useEffect(() => {
    if (address) {
      getUserData();
    }
  }, [address]);

  // Set background to user's favorite color.
  useEffect(() => {
    if (!favoriteColor) return;
    document.body.style = `background: ${favoriteColor};`;
    if (isDisconnected) {
      setFirstName("");
      setDateOfBirth("");
      setFavoriteColor("");
      document.body.style = `background: white;`;
    }
  }, [favoriteColor, isDisconnected]);

  // Write the user's name, date-of-birth, and favorite color to Privy.
  const putUserData = async () => {
    try {
      const [name, birthday, color] = await client.put(address, [
        {
          field: "first-name",
          value: firstName,
        },
        {
          field: "date-of-birth",
          value: dateOfBirth,
        },
        {
          field: "favorite-color",
          value: favoriteColor,
        },
      ]);
      setFirstName(name.text());
      setDateOfBirth(birthday.text());
      setFavoriteColor(color.text());
      if (name && birthday && color) {
        console.log("Successfully wrote user data to Privy.");
        setSavedData(true);
      }
    } catch (error) {
      console.log("Error when writing data to Privy:", error);
    }
  };

  // Get user data from Privy for initial state if user has already written to the DB.
  const getUserData = async () => {
    try {
      if (!address) return;
      // Fetch user's name and favorite color from Privy
      const [firstName, dateOfBirth, favoriteColor] = await client.get(
        address,
        ["first-name", "date-of-birth", "favorite-color"]
      );
      setFirstName(firstName?.text());
      setDateOfBirth(dateOfBirth?.text());
      setFavoriteColor(favoriteColor?.text());
    } catch (error) {
      console.error(error);
    }
  };

  const headerContent = (
    <div>
      <>
        <title>Privy Quickstart</title>
      </>
      <div className="walletHeader">
        <ConnectButton />
      </div>
    </div>
  );

  const connectedContent = () => {
    return (
      <div>
        <p>
          {address || firstName
            ? `Hey ${
                firstName ? firstName : address.substring(0, 5) + "..."
              } 👋`
            : `Connect with the wallet first :)`}
        </p>
        <div>
          <div className="inputForm">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              onChange={(event) => {
                setFirstName(event.target.value);
              }}
              value={firstName}
              placeholder={address ? address.substring(0, 5) + "..." : null}
            />
            <label htmlFor="dob">Date of Birth</label>
            <input
              id="Date Of Birth"
              onChange={(event) => {
                setDateOfBirth(event.target.value);
              }}
              value={dateOfBirth}
            />
            <label htmlFor="color">Favorite Color</label>
            <input
              onChange={(event) => {
                setFavoriteColor(event.target.value);
              }}
              value={favoriteColor}
            />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <button
            style={{ borderRadius: 8 }}
            onClick={putUserData}
            disabled={!address}
          >
            {!savedData ? "Save with Privy" : "Pushed data to Privy ✅"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div>{headerContent}</div>
      <div className="container">
        <h1 style={{ margin: 0 }}>Privy Quickstart</h1>
        <div>{connectedContent()}</div>
      </div>
    </div>
  );
}
