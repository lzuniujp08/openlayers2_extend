///<jscompress sourcefile="Extend.js" />
///渲染判断 重写。。。扩展 geometry类型
OpenLayers.Renderer.Elements.prototype.drawGeometryNode = function(node, geometry, style)
{
      style = style || node._style;

        var options = {
            'isFilled': style.fill === undefined ?true :style.fill,
            'isStroked': style.stroke === undefined ?!!style.strokeWidth :style.stroke
        };
	  var drawn;
	  if (geometry instanceof OpenLayers.Geometry.LinearRing) {
            drawn = this.drawLinearRing(node, geometry);
        } else {
            if (geometry instanceof OpenLayers.Geometry.LineString) {
                options.isFilled = false;
                drawn = this.drawLineString(node, geometry);
            }else {
                    if (geometry instanceof OpenLayers.Geometry.Polygon) {
                        drawn = this.drawPolygon(node, geometry);
                    }else {
                        if (geometry instanceof OpenLayers.Geometry.Point) {
                            if (style.graphic === false) {
                                options.isFilled = false;
                                options.isStroked = false;
                            }
                            drawn = this.drawPoint(node, geometry);
                        }else {
                            if (geometry instanceof OpenLayers.Geometry.Rectangle) {
                                drawn = this.drawRectangle(node, geometry);
                            }

                      }
                    }
                }
            }

       node._options = options; 

        //set style
        //TBD simplify this
        if (drawn != false) {
            return {
                node: this.setStyle(node, style, options, geometry),
                complete: drawn
            };
        } else {
            return false;
        }

							
}

OpenLayers.Renderer.SVG.prototype.getNodeType = function (geometry, style) {
    var nodeType = null;
    if (geometry instanceof OpenLayers.Geometry.LinearRing) {
        nodeType = "polygon";
    } else {
        if (geometry instanceof OpenLayers.Geometry.LineString) {
            nodeType = "polyline";
        }
        else {
            if (geometry instanceof OpenLayers.Geometry.Curve) {
                nodeType = "path";
            }
            else {
                if (geometry instanceof OpenLayers.Geometry.Polygon) {
                    nodeType = "path";
                }
                else {
                    if (geometry instanceof OpenLayers.Geometry.Point) {
                        if (style.externalGraphic) {
                            nodeType = "image";
                        } else {
                            if (this.isComplexSymbol(style.graphicName)) {
                                nodeType = "svg";
                            } else {
                                nodeType = "circle";
                            }
                        }
                    }
                    else {
                        if (geometry instanceof OpenLayers.Geometry.Rectangle) {
                            nodeType = "rect";
                        }
                    }

                }

            }
        }

    }
    return nodeType;
}


OpenLayers.Renderer.VML.prototype.getNodeType = function (geometry, style) {
    var nodeType = null;
    if (geometry instanceof OpenLayers.Geometry.LinearRing) {
        nodeType = "olv:shape";
    } else {
        if (geometry instanceof OpenLayers.Geometry.LineString) {
            nodeType = "olv:shape";
        }
        else {
            if (geometry instanceof OpenLayers.Geometry.Curve) {
                nodeType = "olv:shape";
            }
            else {
                if (geometry instanceof OpenLayers.Geometry.Polygon) {
                    nodeType = "olv:shape";
                }
                else {
                    if (geometry instanceof OpenLayers.Geometry.Point) {
                        if (style.externalGraphic) {
                            nodeType = "olv:rect";
                        } else {
                            if (this.isComplexSymbol(style.graphicName)) {
                                nodeType = "olv:shape";
                            } else {
                                nodeType = "olv:oval";
                            }
                        }
                    }
                    else {
                        if (geometry instanceof OpenLayers.Geometry.Rectangle) {
                            nodeType = "olv:rect";
                        }
                    }

                }

            }
        }

    }
    return nodeType;
}


OpenLayers.Renderer.Canvas.prototype.drawGeometry = function (geometry, style, featureId) {
    var className = geometry.CLASS_NAME;
    if ((className == "OpenLayers.Geometry.Collection") || (className == "OpenLayers.Geometry.MultiPoint") || (className == "OpenLayers.Geometry.MultiLineString") || (className == "OpenLayers.Geometry.MultiPolygon")) {
        for (var i = 0; i < geometry.components.length; i++) {
            this.drawGeometry(geometry.components[i], style, featureId);
        }
        return;
    }
    if (geometry instanceof OpenLayers.Geometry.LinearRing) {
        this.drawLinearRing(geometry, style, featureId);
    }
    else {
        if (geometry instanceof OpenLayers.Geometry.LineString) {
            this.drawLineString(geometry, style, featureId);
        }
        else {
            if (geometry instanceof OpenLayers.Geometry.Polygon) {
                this.drawPolygon(geometry, style, featureId);
            }
            else {
                if (geometry instanceof OpenLayers.Geometry.Point) {
                    this.drawPoint(geometry, style, featureId);
                }
                else {
                    if (geometry instanceof OpenLayers.Geometry.Rectangle) {
                        this.drawRectangle(geometry, style, featureId);
                    }
                }
            }
        }
    }
}
OpenLayers.Geometry.LineString.createCurve = function (C, d, y, B)
{
    var j = "lanczos";
    if (d != undefined)
    {
        j = d
    }
    var l = 10;
    if (y != undefined)
    {
        l = y
    }
    var o =
    {
        method : j,
        clip : "mirror",
        lanczosFilterSize : l,
        cubicTension : 0
    };
    var A = [];
    for (var D = 0; D < C.length; D++)
    {
        A.push([C[D].x, C[D].y])
    }
    r = Smooth(A, o);
    var f = function (p, i)
    {
        return Math.sqrt(Math.pow(p[0] - i[0], 2) + Math.pow(p[1] - i[1], 2))
    };
    var E = 80;
    if (B != undefined)
    {
        E = B
    }
    var z = [];
    var m,
    v,
    e,
    h,
    w,
    r,
    g,
    q,
    n,
    k,
    c,
    a;
    m = f(A[0], A[A.length - 1]) / E;
    h = 2;
    for (q = 0, k = 1 / h; q < 1; q += k)
    {
        c = [r(D + q), r(D + q + 1 / h)],
        g = c[0],
        e = c[1];
        w = f(g, e);
        v = m / w;
        for (n = 0, a = 1 / h; 0 <= a ? n < a : n > a; n += v)
        {
            var x = r(D + q + n);
            z.push(new OpenLayers.Geometry.Point(
                    x[0], x[1]))
        }
    }
    var x = r(D + 1);
    z.push(new OpenLayers.Geometry.Point(x[0], x[1]));
    return new OpenLayers.Geometry.LineString(z)
};
OpenLayers.Geometry.LineString.createBspline = function (n, g)
{
    if (n.length < 2)
    {
        return null
    }
    var t = [];
    var l = 10;
    if (g != undefined)
    {
        l = g
    }
    var o,
    m,
    w,
    v,
    u,
    d,
    c,
    a;
    var r,
    q;
    d = 1 / l;
    var f = Math.sqrt((Math.pow(n[1].x - n[0].x, 2) + Math.pow(n[1].y - n[0].y, 2)) / 2);
    var p = new OpenLayers.Geometry.Point(n[0].x - f, n[0].y - f);
    var s = [];
    s[0] = p;
    for (o = 0; o < n.length - 1; o++)
    {
        var e = [];
        e[0] = n[o];
        var h = new OpenLayers.Geometry.Point(n[o].x * 2 - s[o].x, n[o].y * 2 - s[o].y);
        e[1] = h;
        s[o + 1] = h;
        e[2] = n[o + 1];
        t.push(e[0]);
        for (m = 0; m <= l; m++)
        {
            c = m * d;
            a = c * c;
            w = (a - 2 * c + 1) / 2;
            v = (2 * c - 2 * a + 1) / 2;
            u = a / 2;
            r = w * e[0].x + v * e[1].x + u * e[2].x;
            q = w * e[0].y + v * e[1].y + u * e[2].y;
            t.push(new OpenLayers.Geometry.Point(r, q))
        }
    }
    t.push(n[n.length - 1]);
    return new OpenLayers.Geometry.LineString(t)
};
OpenLayers.Geometry.LineString.createBezier1 = function (p, l, a)
{
    if (a)
    {
        return OpenLayers.Geometry.LineString.createBezier3(p, a)
    }
    var c = [];
    for (var e = 0; e < p.length; e++)
    {
        c[e] = p[e]
    }
    var h;
    var f;
    var g = 0;
    var q;
    var n = c.length;
    var d = [];
    var o = true;
    while (o)
    {
        q = true;
        for (h = 0; h < n - 3; h += 3)
        {
            if (GetBezierGap(c, h) > l)
            {
                q = false;
                InciseBezier(c, h, d);
                c.splice(h + 1, 2);
                for (f = 0; f < 5; f++)
                {
                    c.splice(h + 1 + f, 0, d[f + 1])
                }
                h -= 3;
                n = c.length
            }
            if (q)
            {
                break
            }
        }
        while (g < n - 1)
        {
            if (c[g] === c[g + 1])
            {
                c.splice(g + 1, 1);
                n--
            }
            g++
        }
        o = false
    }
    return new OpenLayers.Geometry.LineString(c)
};
OpenLayers.Geometry.LineString.calculatePointsFBZ2 = function (m, a)
{
    if (!a)
    {
        a = 20
    }
    var c = [];
    var e = 0.05;
    if (a > 0)
    {
        e = 1 / a
    }
    for (var g = 0; g < m.length - 2; )
    {
        var d = m[g];
        var p = m[g + 1];
        var l = m[g + 2];
        c.push(d);
        for (var o = 0; o < 1; )
        {
            var j = (1 - o) * (1 - o) * d.x + 2 * o * (1 - o) * p.x + o * o * l.x;
            var h = (1 - o) * (1 - o) * d.y + 2 * o * (1 - o) * p.y + o * o * l.y;
            var k = new OpenLayers.Geometry.Point(j, h);
            c.push(k);
            o += e
        }
        g += 2;
        if (g >= m.length)
        {
            c.push(d)
        }
    }
    var f = c[c.length - 1];
    var n = m[m.length - 1];
    if (!f.equals(n))
    {
        c.push(n.clone())
    }
    return c
};
OpenLayers.Geometry.LineString.calculatePointsFBZ3 = function (o, a)
{
    if (!a)
    {
        a = 20
    }
    var c = [];
    var e = 0.05;
    if (a > 0)
    {
        e = 1 / a
    }
    for (var g = 0; g < o.length - 3; )
    {
        var d = o[g];
        var j = o[g + 1];
        var h = o[g + 2];
        var n = o[g + 3];
        c.push(d);
        for (var q = 0; q < 1; )
        {
            var l = (1 - q) * (1 - q) * (1 - q) * d.x + 3 * q * (1 - q) * (1 - q) * j.x + 3 * q * q * (1 - q) * h.
            x + q * q * q * n.x;
            var k = (1 - q) * (1 - q) * (1 - q) * d.y + 3 * q * (1 - q) * (1 - q) * j.y + 3 * q * q * (1 - q) * h.y + q * q * q * n.y;
            var m = new OpenLayers.Geometry.Point(l, k);
            c.push(m);
            q += e
        }
        g += 3;
        if (g >= o.length)
        {
            c.push(d)
        }
    }
    var f = c[c.length - 1];
    var p = o[o.length - 1];
    if (!f.equals(p))
    {
        c.push(p.clone())
    }
    return c
};
OpenLayers.Geometry.LineString.calculatePointsFBZN = function (m, a)
{
    if (!a)
    {
        a = m.length * 8
    }
    var c = [];
    var e = 0.05;
    if (a > 0)
    {
        e = 1 / a
    }
    for (var p = 0; p <= 1; )
    {
        var k = 0;
        var j = 0;
        var d = m.length;
        for (var g = 0; g < m.length; g++)
        {
            var h = OpenLayers.Geometry.LineString.BEZ(d - 1, g, p);
            k += m[g].x * h;
            j += m[g].y * h
        }
        var l = new OpenLayers.Geometry.Point(k, j);
        c.push(l);
        p += e
    }
    var f = c[c.length - 1];
    var o = m[m.length - 1];
    if (!f.equals(o))
    {
        c.push(o.clone())
    }
    return c
};
OpenLayers.Geometry.LineString.createBezier2 = function (c, a)
{
    var d = OpenLayers.Geometry.LineString.calculatePointsFBZ2(c, a);
    return new OpenLayers.Geometry.LineString(d)
};
OpenLayers.Geometry.LineString.createBezier3 = function (c, a)
{
    var d = OpenLayers.Geometry.LineString.calculatePointsFBZ3(c, a);
    return new OpenLayers.Geometry.LineString(d)
};
OpenLayers.Geometry.LineString.createBezier = function (n, h)
{
    var a = [];
    for (var d = 0; d < n.length; d++)
    {
        a[d] = n[d]
    }
    var g,
    e,
    f = 0,
    o,
    l = a.length;
    var c = [];
    while (true)
    {
        o = true;
        for (g = 0; g < l - 3; g += 3)
        {
            if (GetBezierGap(a, g) > h)
            {
                o = false;
                InciseBezier(a, g, c);
                a.splice(g + 1, 2);
                for (e = 0; e < 5; e++)
                {
                    a.splice(g + 1 + e, 0, c[e + 1])
                }
                g -= 3;
                l = a.length
            }
            if (o)
            {
                break
            }
        }
        while (f < l - 1)
        {
            if (a[f] === a[f + 1])
            {
                a.splice(f + 1, 1);
                l--
            }
            f++
        }
        return new OpenLayers.Geometry.LineString(a)
    }
};
InciseBezier = function (c, d, f)
{
    var a = [];
    a[0] = [];
    a[1] = [];
    a[2] = [];
    var e;
    for (e = 0; e < 3; e++)
    {
        a[0][e] = new OpenLayers.Geometry.Point;
        a[0][e].x = (c[d + e].x + c[d + e + 1].x) / 2;
        a[0][e].y = (c[d + e].y + c[d + e + 1].y) / 2
    }
    for (e = 0; e < 2; e++)
    {
        a[1][e] = new OpenLayers.Geometry.Point;
        a[1][e].x = (a[0][e].x + a[0][e + 1].x) / 2;
        a[1][e].y = (a[0][e].y + a[0][e + 1].y) / 2
    }
    a[2][0] = new OpenLayers.Geometry.Point;
    a[2][0].x = (a[1][0].x + a[1][1].x) / 2;
    a[2][0].y = (a[1][0].y + a[1][1].y) / 2;
    f[0] = c[d];
    f[1] = a[0][0];
    f[2] = a[1][0];
    f[3] = a[2][0];
    f[4] = a[1][1];
    f[5] = a[0][2];
    f[6] = c[d + 3];
    return true
};
GetBezierGap = function (a, c)
{
    var e = 0;
    for (var d = 1; d < 4; d++)
    {
        if (Math.abs(a[c + d].x - a[c + d - 1].x) > e)
        {
            e = Math.abs(a[c + d].x - a[c + d - 1].x)
        }
        if (Math.abs(a[c + d].y - a[c + d - 1].y) > e)
        {
            e = Math.abs(a[c + d].y - a[c + d - 1].y)
        }
    }
    return e
};
OpenLayers.Geometry.LineString.createBezierN = function (c, a)
{
    var d = OpenLayers.Geometry.LineString.calculatePointsFBZN(c, a);
    return new OpenLayers.Geometry.LineString(d)
};
OpenLayers.Geometry.LineString.BEZ = function (d, a, c)
{
    return OpenLayers.Geometry.LineString.combSort(d, a) * Math.pow(c, a) * Math.pow(1 - c, d - a)
};
OpenLayers.Geometry.LineString.combSort = function (e, a)
{
    var d = OpenLayers.Geometry.LineString.factorial(e);
    var c = OpenLayers.Geometry.LineString.factorial(a) * OpenLayers.Geometry.LineString.factorial(e - a);
    return d / c
};
OpenLayers.Geometry.LineString.factorial = function (d)
{
    var a = 1;
    for (var c = 1; c <= d; c++)
    {
        a *= c
    }
    return a
};
OpenLayers.Geometry.LineString.calculateCardinalPoints = function (z)
{
    if (z == null || z.length < 3)
    {
        return z
    }
    var A = z;
    var j = [];
    var p = 0.4;
    var H = 0.5;
    var D = 0.005;
    var v = A.length - 1;
    for (var y = 0; y <= v + 1 - 3; y++)
    {
        var g = A[y];
        var f = A[y + 1];
        var d = A[y + 2];
        var m = new OpenLayers.Geometry.Point();
        var h = new OpenLayers.Geometry.Point();
        var F = new OpenLayers.Geometry.Point(f.x - g.x, f.y - g.y);
        var a = new OpenLayers.Geometry.Point(d.x - f.x, d.y - f.y);
        var u = Math.sqrt(F.x * F.x + F.y * F.y);
        var I = Math.sqrt(a.x * a.x + a.y * a.y);
        var s = new OpenLayers.Geometry.Point(F.x / u, F.y / u);
        var l = new OpenLayers.Geometry.Point(a.x / I, a.y / I);
        var G = new OpenLayers.Geometry.Point(s.x + l.x, s.y + l.y);
        var c = Math.sqrt(G.x * G.x + G.y * G.y);
        var r = new OpenLayers.Geometry.Point(G.x / c, G.y / c);
        var o = (s.x * l.x + s.y * l.y) / 1;
        if (Math.abs(1 - o) < D)
        {
            m.x = f.x - l.x * u * p;
            m.y = f.y - l.y * u * p;
            h.x = f.x + s.x * I * p;
            h.y = f.y + s.y * I * p
        }
        else
        {
            m.x = f.x - r.x * u * p;
            m.y = f.y - r.y * u * p;
            h.x = f.x + r.x * I * p;
            h.y = f.y + r.y * I * p
        }
        j[y * 3 + 2 + 0] = m;
        j[y * 3 + 2 + 1] = f;
        j[y * 3 + 2 + 2] = h;
        if (y == 0)
        {
            var E = new OpenLayers.Geometry.Point();
            var x = new OpenLayers.Geometry.Point(m.x - g.x, m.y - g.y);
            var C = Math.sqrt(x.x * x.x + x.y * x.y);
            var i = new OpenLayers.Geometry.Point(x.x / C, x.y / C);
            E.x = g.x + i.x * u * p * H;
            E.y = g.y + i.y * u * p * H;
            j[y * 3 + 0] = g;
            j[y * 3 + 1] = E
        }
        if (y == v + 1 - 3)
        {
            var w = new OpenLayers.Geometry.Point();
            var J = new OpenLayers.Geometry.Point(h.x - d.x, h.y - d.y);
            var B = Math.sqrt(J.x * J.x + J.y * J.y);
            var q = new OpenLayers.Geometry.Point(J.x / B, J.y / B);
            w.x = d.x + q.x * I * p * H;
            w.y = d.y + q.y * I * p * H;
            j[y * 3 + 2 + 3] = w;
            j[y * 3 + 2
                +4] = d
        }
    }
    return j
};
OpenLayers.Geometry.LineString.createCloseCardinal = function (w)
{
    if (w == null || w.length < 3)
    {
        return w
    }
    var o = w[0];
    w.push(o);
    var x = w;
    var i = [];
    var p = 0.4;
    var B = 0.5;
    var y = 0.005;
    var u = x.length - 1;
    for (var v = 0; v <= u - 1; v++)
    {
        if (v == u - 1)
        {
            var g = x[u - 1];
            var f = x[0];
            var d = x[1]
        }
        else
        {
            var g = x[v];
            var f = x[v + 1];
            var d = x[v + 2]
        }
        var l = new OpenLayers.Geometry.Point();
        var h = new OpenLayers.Geometry.Point();
        var z = new OpenLayers.Geometry.Point(f.x - g.x, f.y - g.y);
        var a = new OpenLayers.Geometry.Point(d.x - f.x, d.y - f.y);
        var s = Math.sqrt(z.x * z.x + z.y * z.y);
        var C = Math.sqrt(a.x * a.x + a.y * a.y);
        var r = new OpenLayers.Geometry.Point(z.x / s, z.y / s);
        var j = new OpenLayers.Geometry.Point(a.x / C, a.y / C);
        var A = new OpenLayers.Geometry.Point(r.x + j.x, r.y + j.y);
        var c = Math.sqrt(A.x * A.x + A.y * A.y);
        var q = new OpenLayers.Geometry.Point(A.x / c, A.y / c);
        var m = (r.x * j.x + r.y * j.y) / 1;
        if (Math.abs(1 - m) < y)
        {
            l.x = f.x - j.x * s * p;
            l.y = f.y - j.y * s * p;
            h.x = f.x + r.x * C * p;
            h.y = f.y + r.y * C * p
        }
        else
        {
            l.x = f.x - q.x * s * p;
            l.y = f.y - q.y * s * p;
            h.x = f.x + q.x * C * p;
            h.y = f.y + q.y * C * p
        }
        if (v == u - 1)
        {
            i[0] = f;
            i[1] = h;
            i[(u - 2) * 3 + 2 + 3] = l;
            i[(u - 2) * 3 + 2 + 4] = x[u]
        }
        else
        {
            i[v * 3 + 2 + 0] = l;
            i[v * 3 + 2 + 1] = f;
            i[v * 3 + 2 + 2] = h
        }
    }
    return i
};

OpenLayers.Util.copyAttributes = function (a, d) {
    a = a || {};
    if (d) {
        for (var c in d) {
            var b = d[c];
            if (b !== undefined && c != "CLASS_NAME" && typeof b != "function") {
                a[c] = b
            }
        }
    }
    return a
};


