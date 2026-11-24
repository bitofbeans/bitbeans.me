/** @type {import("next").NextConfig} */
const config = {
  async redirects() {
    return [
      {
        source: "/tpcl",
        destination:
          "https://docs.google.com/spreadsheets/d/137Jqpwop9ueLpzEnMtZ41OkYh9Pr3PgVx_o29GJx4QY/",
        permanent: false,
      },
    ];
  },
};

export default config;
