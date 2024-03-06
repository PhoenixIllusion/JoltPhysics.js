Module['setClassProxy'] = function (__class__, proxy) {
  __class__ && (__class__.__cache__ = proxy);
}
