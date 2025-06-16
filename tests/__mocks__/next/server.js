// Mock for NextRequest and NextResponse
class NextRequest {
  constructor(url, init) {
    this.url = url
    this.method = (init && init.method) || 'GET'
    this._body = (init && init.body) || null
    this.headers = new Map()
  }

  async json() {
    if (typeof this._body === 'string') {
      return JSON.parse(this._body)
    }
    return this._body
  }
}

class NextResponse {
  constructor(body, init) {
    this.body = body
    this.status = (init && init.status) || 200
    this.headers = new Map()
  }

  static json(data, init) {
    return new NextResponse(data, init)
  }

  async json() {
    return this.body
  }
}

module.exports = {
  NextRequest,
  NextResponse,
}