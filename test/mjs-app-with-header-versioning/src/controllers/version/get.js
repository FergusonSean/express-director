export default {
  versions: {
    v1: {
      handler: (_, res) => res.send('Used version 1'),
    },
    v2: {
      handler: (_, res) => res.send('Used version 2'),
    }
  }
};
