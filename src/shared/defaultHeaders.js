export const defaultHeaders = defaultHeadersVal => ({
  init(context, next) {
    const { headers = {} } = context.state.request;
    context.state.request.headers = {
      ...defaultHeadersVal,
      ...headers,
    };
    next();
  },
});
