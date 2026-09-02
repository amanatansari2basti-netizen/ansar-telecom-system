import { useState } from "react";
import {
  createUserWithEmailAndPassword,
} from "firebase/auth";

import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";

const CreateOwner = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleCreateOwner = async (event) => {
    event.preventDefault();

    try {
      setMessage("Creating owner account...");

      const credential =
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      const user = credential.user;

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          name: "Aqib Ansari",
          email: user.email,
          phone: "",
          role: "owner",
          status: "active",
          createdAt: serverTimestamp(),
        }
      );

      setMessage(
        "Owner account created successfully."
      );
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Create Owner</h1>

      <form
        onSubmit={handleCreateOwner}
        style={{
          maxWidth: "400px",
          display: "grid",
          gap: "14px",
        }}
      >
        <input
          type="email"
          placeholder="Owner email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          minLength={6}
          required
        />

        <button type="submit">
          Create Owner Account
        </button>
      </form>

      {message && (
        <p>{message}</p>
      )}
    </div>
  );
};

export default CreateOwner;