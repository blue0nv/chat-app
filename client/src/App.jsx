import { useEffect } from "react";

function App() {
  useEffect(() => {
    fetch("http://localhost:3000/")
      .then((res) => res.text())
      .then((data) => console.log(data))
      .catch((err) => console.error(err));
  }, []);

  return <h1>Chat App</h1>;
}

export default App;