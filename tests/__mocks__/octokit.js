module.exports = {
  Octokit: jest.fn().mockImplementation(() => ({
    rest: {
      repos: {
        listForAuthenticatedUser: jest.fn(),
      },
      issues: {
        create: jest.fn(),
      },
    },
  })),
}