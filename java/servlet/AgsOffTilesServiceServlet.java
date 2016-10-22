package com.lzugis.servlet;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.codec.binary.Base64;

import com.lzugis.tile.helper.CommonConfig;

/**
 * Servlet implementation class TileServlet
 */
@WebServlet(description = "get arcgis offline tile", urlPatterns =  {"/agstile"})
public class AgsOffTilesServiceServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	private String rootPath = "";
	private static String base64Blank = "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NkZFQUUzNjgyRjJBMTFFNEFBQ0JGMEMyRjFFNUE0MUYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NkZFQUUzNjkyRjJBMTFFNEFBQ0JGMEMyRjFFNUE0MUYiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo2RkVBRTM2NjJGMkExMUU0QUFDQkYwQzJGMUU1QTQxRiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo2RkVBRTM2NzJGMkExMUU0QUFDQkYwQzJGMUU1QTQxRiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pij7ZYAAAAJdSURBVHja7NQxAQAACMMwwL/nYQAHJBJ6tJMU8NNIAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAGAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAYABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAEABgAYAGAAgAGAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAQAGABgAYACAAYABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAAYAGABgAIABAJcVYADnygT9CIf4ngAAAABJRU5ErkJggg==";
	
    /**
     * @see HttpServlet#HttpServlet()
     */
    public AgsOffTilesServiceServlet() {
        super();
        // TODO Auto-generated constructor stub
        try{
			rootPath = CommonConfig.getVal("tile.agspath")+File.separator;
        }
        catch(Exception e){
        	e.printStackTrace();
        }
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		this.doPost(request, response);
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	@SuppressWarnings("resource")
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String x= request.getParameter("x");
        String y= request.getParameter("y");
        String z= request.getParameter("z");
        String layer= request.getParameter("layer");
        String type= request.getParameter("type");//file为紧凑型，image为松散型
        String tilePath = rootPath+layer+"/Layers/_alllayers";
        int level = Integer.parseInt(z);
        int row = Integer.parseInt(x);
        int col = Integer.parseInt(y);
        try {
        	OutputStream os = response.getOutputStream();
        	byte[] output = null;
        	int outlength = 0;
        	if(type.equals("file")){//紧凑型
	            String l = "L" + getZero(2,z.length()) + level;
	
	            int rGroup = 128 * (row / 128);
	            String rTail = Integer.toHexString(rGroup);
	            String r = "R" + getZero(4,rTail.length()) +rTail ;
	
	            int cGroup = 128 * (col / 128);
	            String cTail = Integer.toHexString(cGroup);
	            String c = "C" + getZero(4,cTail.length()) + cTail;
	            String bundleBase = String.format("%s/%s/%s%s", tilePath, l, r, c);
	            String bundleFileName = bundleBase + ".bundle";
	            String bundlxFileName = bundleBase + ".bundlx";
	
	            File file = new File(bundleFileName);
	            
	            if(file.exists()){
		            int index = 128 * (col - cGroup) + (row - rGroup);
					FileInputStream isBundlx = new FileInputStream(bundlxFileName);
		            isBundlx.skip(16 + 5 * index);
		            byte[] buffer = new byte[5];
		            isBundlx.read(buffer);
		            long offset = (long)(buffer[0]&0xff) + (long)(buffer[1]&0xff)*256 + (long)(buffer[2]&0xff)*65536 + (long)(buffer[3]&0xff)*16777216+ (long)(buffer[4]&0xff)*4294967296L;
		            FileInputStream isBundle = new FileInputStream(bundleFileName);
		            isBundle.skip(offset);
		            byte[] lengthBytes = new byte[4];
		            isBundle.read(lengthBytes);
		            int length = (int)(lengthBytes[0]&0xff)+ (int)(lengthBytes[1]&0xff)*256	+ (int)(lengthBytes[2]&0xff)*65536+ (int)(lengthBytes[3]&0xff)*16777216;
		            byte [] result = new byte[length];
		            isBundle.read(result);
		            if(result.length>0){
		                output = result;
		                outlength = length;
		            }
	            }
	            else{
	            	byte[] blankImg = Base64.decodeBase64(base64Blank);
	            	InputStream is = new ByteArrayInputStream(blankImg); 
	            	int count=0;
	            	while ((count = is.read(blankImg)) != -1) {
	                    output = blankImg;
		                outlength = count;
	                }
	            }
        	}
        	else{//松散型
        		String l = "L" + getZero(2,z.length()) + level;
                
                String strRow = Integer.toHexString(row);        
                String r = "R" +getZero(8,strRow.length())+ strRow;
                
                String strCol = Integer.toHexString(col);
                String c = "C"+getZero(8,strCol.length()) + strCol;
                
                String imgfile = tilePath+l+"/"+r+"/"+c+".png";
                
                InputStream is = null;
                
                File file = new File(imgfile);
                if(!file.exists()){
                	imgfile = tilePath+l+"/"+r+"/"+c+".jpg";
                	file = new File(imgfile);
                	 if(!file.exists()){
                		 byte[] blankImg = Base64.decodeBase64(base64Blank);
                		 is=new ByteArrayInputStream(blankImg); 
                	 }
                	 else{
                		 is = new FileInputStream(imgfile);
                	 }
                } 
                else{
                	is = new FileInputStream(imgfile);
                }
                int count = 0;
            	byte[] buffer = new byte[1024 * 1024];
            	while ((count = is.read(buffer)) != -1) {
                    output = buffer;
	                outlength = count;
                }
        	}
        	os.write(output, 0, outlength);
        	os.flush();
            os.close();
        }
        catch (IOException e) {
            e.printStackTrace();
        }
	}
	private String getZero(int length,int strLength){
		int zeroLength = length-strLength;
		String strZero = "";
		for(int i=0;i<zeroLength;i++){
			strZero+="0";
		}
		return strZero;
	}
}
