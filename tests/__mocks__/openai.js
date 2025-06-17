class OpenAI {
  constructor(config) {
    this.apiKey = config?.apiKey;
    this.models = {
      list: jest.fn().mockImplementation(() => {
        if (!this.apiKey || this.apiKey === 'invalid-key') {
          const error = new Error('Invalid API key');
          error.status = 401;
          throw error;
        }
        return Promise.resolve({
          data: [{ id: 'gpt-4' }, { id: 'gpt-3.5-turbo' }]
        });
      })
    };
    this.chat = {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mocked response' } }]
        })
      }
    };
  }
}

module.exports = OpenAI;
module.exports.default = OpenAI;