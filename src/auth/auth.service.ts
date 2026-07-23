
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

