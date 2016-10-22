package com.lzugis.servlet;

import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.lzugis.tile.ATTmsService;

@WebServlet(description = "get attile tile", urlPatterns =  {"/attile"})
public class ATTilesServiceServlet extends HttpServlet {	
	/**
	 * serialVersionUID
	 */
	private static final long serialVersionUID = 1L;
	
	@Override
	public void init(ServletConfig config) throws ServletException {
		// TODO Auto-generated method stub
		super.init(config);
		try{
//			TileCloudHelper.getInstance().initTileLayerFromXML();
		}
		catch(Exception e){
			e.printStackTrace();
		}
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}

	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		response.setCharacterEncoding("utf-8");
		String requestMethod = request.getParameter("request"); 
		String layername = request.getParameter("layername");
		String z = request.getParameter("z"); 
		String x = request.getParameter("x"); 
		String y = request.getParameter("y"); 
		ATTmsService atTmsService = ATTmsService.getInstance();				
		if("gettile".equalsIgnoreCase(requestMethod)){
			byte[] data = null;
			
			int _z = Integer.parseInt(z);
			int _x = Integer.parseInt(x);
			int _y = Integer.parseInt(y);
			
			data = atTmsService.getTileData(layername,_z,_y,_x);
			
			if (data != null){
				response.setContentType("image/png");
				ServletOutputStream _out = response.getOutputStream();
				BufferedInputStream bis = new BufferedInputStream(new ByteArrayInputStream(data), 8192);
				byte[] buffer = new byte[8192];
				int _len;
				while ((_len = bis.read(buffer)) > 0) {
					_out.write(buffer, 0, _len);
				}
				_out.flush();
				_out.close();
				bis.close();
			}
		}
	}
}
