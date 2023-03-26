import hello from './hello'

describe('hello', () => {
  it('should return hello world', () => expect(hello()).toBe('hello world'))
})
