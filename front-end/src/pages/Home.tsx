const Home = () => {
  return (
    <div
      className="text-center text-white d-flex flex-column align-items-center justify-content-center"
      style={{
        backgroundImage: "url('src/assets/images/cafe.png')", 
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        height: "100vh",
        margin: 0,
        padding: 0,
      }}
    >
      <h1
        style={{
          fontSize: "7.2rem",
          fontStyle: "italic",
          fontFamily: "'Brush Script MT', cursive",
          textShadow: "2px 2px 6px rgba(0, 0, 0, 0.6)",
        }}
      >
        Welcome to Shrey’s Cafe
      </h1>
      <p
        className="lead mt-3"
        style={{
          maxWidth: "900px",
          fontSize: "2.2rem",
          fontStyle: "italic",
          fontFamily: "'Brush Script MT', cursive",
          textShadow: "1px 1px 5px rgba(0, 0, 0, 0.5)",
        }}
      >
        A cozy corner of delicious pastries, fresh brews, and heartfelt flavors.
        Discover handcrafted dishes made with love served with warmth, every
        single time.
      </p>
    </div>
  );
};

export default Home;
